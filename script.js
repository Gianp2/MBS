// Inicializar Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD0dfRMXPv35Qpe54P3xezjt4OAACM9Flc",
  authDomain: "peluqueriambs.firebaseapp.com",
  projectId: "peluqueriambs",
  storageBucket: "peluqueriambs.appspot.com",
  messagingSenderId: "687777736494",
  appId: "1:687777736494:web:e2ea7be639eaafee2a3cbf"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Horarios
const horariosManana = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00"];
const horariosTarde = ["15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"];
const horarios = [...horariosManana, ...horariosTarde];
const diasHabilitados = [2, 3, 4, 5, 6]; // Martes a sábado

// Parsear fecha desde DD/MM/YYYY o YYYY-MM-DD a Date
function parseDMY(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  }
  if (dateStr.includes("-")) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return null;
}

// Formatear fecha a DD/MM/YYYY
function formatDate(dateStr) {
  if (!dateStr) return "";
  let date;
  if (dateStr.includes("-")) {
    const [year, month, day] = dateStr.split("-").map(Number);
    date = new Date(year, month - 1, day);
  } else if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/").map(Number);
    date = new Date(year, month - 1, day);
  } else {
    return "";
  }
  if (isNaN(date)) return "";
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

// Formatear fecha a YYYY-MM-DD
function formatDateToISO(date) {
  if (!(date instanceof Date) || isNaN(date)) return "";
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

// Obtener turnos desde Firestore
async function obtenerTurnos() {
  try {
    const querySnapshot = await db.collection("turnos").get();
    const turnos = [];
    querySnapshot.forEach((doc) => {
      turnos.push({ id: doc.id, ...doc.data() });
    });
    return turnos;
  } catch (error) {
    console.error("Error al obtener turnos: ", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los turnos. Inténtalo de nuevo.",
      confirmButtonColor: "#facc15"
    });
    return [];
  }
}

// Escuchar turnos en tiempo real
function escucharTurnos(callback) {
  db.collection("turnos").onSnapshot((snapshot) => {
    const turnos = [];
    snapshot.forEach((doc) => {
      turnos.push({ id: doc.id, ...doc.data() });
    });
    callback(turnos);
  }, (error) => {
    console.error("Error al escuchar turnos: ", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los turnos en tiempo real. Inténtalo de nuevo.",
      confirmButtonColor: "#facc15"
    });
  });
}

// Guardar turno en Firestore
async function guardarTurno(turno) {
  try {
    const docRef = await db.collection("turnos").add(turno);
    console.log("Turno guardado con ID: ", docRef.id);
  } catch (error) {
    console.error("Error al guardar turno: ", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo guardar el turno. Inténtalo de nuevo.",
      confirmButtonColor: "#facc15"
    });
  }
}

// Generar ID secuencial para un turno
async function generarIdTurno() {
  const turnos = await obtenerTurnos();
  const ids = turnos.map(t => parseInt(t.id) || 0);
  const maxId = Math.max(...ids, 0);
  return (maxId + 1).toString();
}

// Generar turnos para una fecha específica
async function generarTurnos() {
  const fechaGenerar = document.getElementById("fechaGenerar").value;
  if (!fechaGenerar) {
    Swal.fire({
      icon: "warning",
      title: "Falta fecha",
      text: "Por favor, selecciona una fecha para generar los turnos.",
      confirmButtonColor: "#facc15"
    });
    return;
  }

  const selectedDate = parseDMY(fechaGenerar);
  if (!selectedDate || isNaN(selectedDate)) {
    Swal.fire({
      icon: "warning",
      title: "Fecha inválida",
      text: "Por favor, selecciona una fecha válida.",
      confirmButtonColor: "#facc15"
    });
    return;
  }

  if (!diasHabilitados.includes(selectedDate.getDay())) {
    Swal.fire({
      icon: "warning",
      title: "Día no laborable",
      text: "Por favor, selecciona un día laborable (martes a sábado).",
      confirmButtonColor: "#facc15"
    });
    return;
  }

  const turnos = await obtenerTurnos();
  const formattedDate = formatDate(fechaGenerar);
  const turnosExistentes = new Set(turnos
    .filter(t => t.fecha === formattedDate)
    .map(t => t.hora));

  const nuevosTurnos = [];
  for (const hora of horarios) {
    if (!turnosExistentes.has(hora)) {
      const id = await generarIdTurno();
      nuevosTurnos.push({
        id: id,
        fecha: formattedDate,
        hora: hora,
        Disponible: "Sí",
        nombre: "",
        telefono: ""
      });
    }
  }

  if (nuevosTurnos.length === 0) {
    Swal.fire({
      icon: "info",
      title: "Sin turnos nuevos",
      text: `Todos los turnos para ${formattedDate} ya están generados.`,
      confirmButtonColor: "#facc15"
    });
    return;
  }

  for (const turno of nuevosTurnos) {
    await guardarTurno(turno);
  }

  Swal.fire({
    icon: "success",
    title: "Turnos generados",
    text: `Se generaron ${nuevosTurnos.length} turnos para ${formattedDate} correctamente.`,
    timer: 2000,
    showConfirmButton: false
  });
  document.getElementById("fechaGenerar").value = "";
}

// Eliminar turno
async function deleteTurno(id) {
  try {
    await db.collection("turnos").doc(id).delete();
    Swal.fire({
      icon: "success",
      title: "Turno eliminado",
      text: "El turno ha sido eliminado correctamente.",
      timer: 1500,
      showConfirmButton: false
    });
  } catch (error) {
    console.error("Error al eliminar turno: ", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo eliminar el turno. Inténtalo de nuevo.",
      confirmButtonColor: "#facc15"
    });
  }
}

// Actualizar turno
async function updateTurno(id, disponible, nombre = "", telefono = "") {
  try {
    const turnos = await obtenerTurnos();
    const turno = turnos.find(t => t.id === id);
    if (!turno) {
      throw new Error("Turno no encontrado");
    }
    await db.collection("turnos").doc(id).update({
      Disponible: disponible,
      nombre: disponible === "Sí" ? "" : nombre,
      telefono: disponible === "Sí" ? "" : telefono
    });
    Swal.fire({
      icon: "success",
      title: "Turno actualizado",
      text: "El turno ha sido actualizado correctamente.",
      timer: 1500,
      showConfirmButton: false
    });
  } catch (error) {
    console.error("Error al actualizar turno: ", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo actualizar el turno. Inténtalo de nuevo.",
      confirmButtonColor: "#facc15"
    });
  }
}

// Login con Firebase Authentication
async function login(email, password) {
  console.log("Intentando login con:", email);
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    console.log("Usuario logueado: ", userCredential.user.email);
    mostrarTurnosAdmin();
  } catch (error) {
    console.error("Error en login: ", error.code, error.message);
    Swal.fire({
      icon: "error",
      title: "Error de autenticación",
      text: error.code === "auth/invalid-credential" 
        ? "Correo o contraseña incorrectos."
        : "No se pudo iniciar sesión. Inténtalo de nuevo.",
      confirmButtonColor: "#facc15"
    });
  }
}

// Logout con Firebase Authentication
async function logout() {
  try {
    await auth.signOut();
    console.log("Usuario desconectado");
    document.getElementById("admin-modal").classList.remove("active");
    Swal.fire({
      icon: "success",
      title: "Sesión cerrada",
      text: "Has cerrado sesión correctamente.",
      timer: 1500,
      showConfirmButton: false
    });
  } catch (error) {
    console.error("Error al cerrar sesión: ", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
      confirmButtonColor: "#facc15"
    });
  }
}

// Mostrar prompt de login para administrador
function mostrarPromptClave() {
  console.log("Mostrando prompt de login");
  Swal.fire({
    title: "Acceso Administrativo",
    html: `
      <input type="email" id="adminEmail" class="swal2-input" placeholder="Correo electrónico">
      <input type="password" id="adminPassword" class="swal2-input" placeholder="Contraseña">
    `,
    showCancelButton: true,
    confirmButtonText: "Iniciar Sesión",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#facc15",
    cancelButtonColor: "#e3342f",
    preConfirm: () => {
      const email = document.getElementById("adminEmail").value;
      const password = document.getElementById("adminPassword").value;
      if (!email || !password) {
        Swal.showValidationMessage("Por favor, ingresa correo y contraseña");
        return false;
      }
      return { email, password };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const { email, password } = result.value;
      login(email, password);
    }
  }).catch((error) => {
    console.error("Error en el prompt de login: ", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo mostrar el formulario de login. Inténtalo de nuevo.",
      confirmButtonColor: "#facc15"
    });
  });
}

// Manejar toggle disponible
async function handleToggleDisponible(id, currentDisponible) {
  const nuevoEstado = currentDisponible === "Sí" ? "No" : "Sí";
  await updateTurno(id, nuevoEstado);
}

// Manejar edición de nombre
async function handleEditName(id, currentName, currentDisponible) {
  Swal.fire({
    title: "Editar Nombre del Cliente",
    input: "text",
    inputLabel: "Nombre del Cliente",
    inputValue: currentName,
    inputPlaceholder: "Ingresa el nombre del cliente",
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#facc15",
    cancelButtonColor: "#e3342f",
    inputValidator: (value) => {
      if (!value) {
        return "Debes ingresar un nombre";
      }
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      await updateTurno(id, "No", result.value);
    }
  });
}

// Manejar edición de turno
async function handleEditTurno(id, currentFecha, currentHora, currentNombre, currentTelefono, currentDisponible) {
  Swal.fire({
    title: "Editar Turno",
    html: `
      <label class="block text-sm font-medium mb-2 text-gray-200">Fecha:</label>
      <input type="date" id="editFecha" value="${formatDateToISO(parseDMY(currentFecha))}" class="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-gray-200 mb-4">
      <label class="block text-sm font-medium mb-2 text-gray-200">Hora:</label>
      <select id="editHora" class="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-gray-200 mb-4">
        ${horarios.map(h => `<option value="${h}" ${h === currentHora ? "selected" : ""}>${h}</option>`).join("")}
      </select>
      <label class="block text-sm font-medium mb-2 text-gray-200">Nombre:</label>
      <input type="text" id="editNombre" value="${currentNombre}" class="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-gray-200 mb-4">
      <label class="block text-sm font-medium mb-2 text-gray-200">Teléfono:</label>
      <input type="tel" id="editTelefono" value="${currentTelefono}" pattern="[0-9]{10,}" class="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-gray-200">
    `,
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#facc15",
    cancelButtonColor: "#e3342f",
    preConfirm: async () => {
      const fecha = document.getElementById("editFecha").value;
      const hora = document.getElementById("editHora").value;
      const nombre = document.getElementById("editNombre").value;
      const telefono = document.getElementById("editTelefono").value;

      if (!fecha || !hora || !nombre || !telefono) {
        Swal.showValidationMessage("Todos los campos son obligatorios");
        return false;
      }

      const selectedDate = parseDMY(fecha);
      if (!selectedDate || isNaN(selectedDate)) {
        Swal.showValidationMessage("La fecha ingresada no es válida");
        return false;
      }

      if (!diasHabilitados.includes(selectedDate.getDay())) {
        Swal.showValidationMessage("La fecha debe ser un día laborable (martes a sábado)");
        return false;
      }

      const turnos = await obtenerTurnos();
      const turnoExists = turnos.some(t => t.fecha === formatDate(fecha) && t.hora === hora && t.id !== id);
      if (turnoExists) {
        Swal.showValidationMessage("Ya existe un turno en esa fecha y hora.");
        return false;
      }

      return { fecha, hora, nombre, telefono };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const { fecha, hora, nombre, telefono } = result.value;
      try {
        await db.collection("turnos").doc(id).set({
          id: id,
          fecha: formatDate(fecha),
          hora: hora,
          Disponible: "No",
          nombre: nombre,
          telefono: telefono
        });
        Swal.fire({
          icon: "success",
          title: "Turno actualizado",
          text: "El turno ha sido actualizado correctamente.",
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        console.error("Error al actualizar turno: ", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar el turno. Inténtalo de nuevo.",
          confirmButtonColor: "#facc15"
        });
      }
    }
  });
}

// Manejar eliminación de turno
async function handleDeleteTurno(id) {
  Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción eliminará el turno permanentemente.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#e3342f"
  }).then(async (result) => {
    if (result.isConfirmed) {
      await deleteTurno(id);
    }
  });
}

// Exportar turnos a JSON
async function exportTurnos() {
  try {
    const turnos = await obtenerTurnos();
    const dataStr = JSON.stringify(turnos, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `turnos_mbs_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Swal.fire({
      icon: "success",
      title: "Turnos exportados",
      text: "Los turnos se han exportado correctamente como archivo JSON.",
      timer: 1500,
      showConfirmButton: false
    });
  } catch (error) {
    console.error("Error al exportar turnos: ", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron exportar los turnos. Inténtalo de nuevo.",
      confirmButtonColor: "#facc15"
    });
  }
}

// Importar turnos desde JSON
async function importTurnos() {
  Swal.fire({
    title: "Importar Turnos",
    text: "Selecciona un archivo JSON con los turnos.",
    input: "file",
    inputAttributes: {
      accept: ".json",
      "aria-label": "Subir archivo JSON"
    },
    showCancelButton: true,
    confirmButtonText: "Importar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#facc15",
    cancelButtonColor: "#e3342f"
  }).then(async (result) => {
    if (result.isConfirmed && result.value) {
      const file = result.value;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedTurnos = JSON.parse(e.target.result);
          if (!Array.isArray(importedTurnos)) {
            throw new Error("El archivo no contiene una lista válida de turnos.");
          }
          const isValid = importedTurnos.every(t => 
            t.id && t.fecha && t.hora && t.Disponible && 
            (t.Disponible === "Sí" || (t.nombre && t.telefono))
          );
          if (!isValid) {
            throw new Error("El formato de los turnos no es válido.");
          }
          const existingTurnos = await obtenerTurnos();
          for (const turno of importedTurnos) {
            const turnoExists = existingTurnos.some(t => t.fecha === turno.fecha && t.hora === turno.hora);
            if (!turnoExists) {
              const newId Shadows
              await db.collection("turnos").doc(newId).set({ ...turno, id: newId });
            }
          }
          Swal.fire({
            icon: "success",
            title: "Turnos importados",
            text: "Los turnos se han importado correctamente.",
            timer: 1500,
            showConfirmButton: false
          });
        } catch (err) {
          console.error("Error al importar turnos: ", err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `No se pudieron importar los turnos: ${err.message}`,
            confirmButtonColor: "#facc15"
          });
        }
      };
      reader.readAsText(file);
    }
  });
}

// Mostrar turnos en el panel de administración
function mostrarTurnosAdmin() {
  escucharTurnos((turnos) => {
    const lista = document.getElementById("listaTurnosAdmin");
    const listaMobile = document.getElementById("turnos-mobile");
    lista.innerHTML = "";
    listaMobile.innerHTML = "";

    if (turnos.length === 0) {
      lista.innerHTML = `<tr><td colspan="6" class="text-center">No se encontraron turnos. Genera turnos para comenzar.</td></tr>`;
      listaMobile.innerHTML = `<p class="text-center text-gray-200">No se encontraron turnos. Genera turnos para comenzar.</p>`;
      document.getElementById("admin-modal").classList.add("active");
      return;
    }

    turnos.sort((a, b) => {
      const dateA = parseDMY(a.fecha);
      const dateB = parseDMY(b.fecha);
      return dateA - dateB || a.hora.localeCompare(b.hora);
    });

    turnos.forEach((t) => {
      const id = t.id || "";
      const fecha = t.fecha ? formatDate(t.fecha) : "Fecha no disponible";
      const hora = t.hora || "Hora no disponible";
      const disponible = t.Disponible || "Desconocido";
      const nombre = t.nombre || "";
      const telefono = t.telefono || "";
      const estado = disponible === "Sí" ? '<span style="color: #10b981;">Disponible</span>' : nombre ? '<span style="color: #facc15;">Reservado</span>' : '<span style="color: #e3342f;">No Disponible</span>';

      // Fila para la tabla (escritorio)
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${id}</td>
        <td>${fecha}</td>
        <td>${hora}</td>
        <td>${estado}</td>
        <td class="editable-name" onclick="handleEditName('${id}', '${nombre}', '${disponible}')">${nombre || "—"}</td>
        <td>
          <button class="toggle-disponible ${disponible === 'Sí' ? 'disponible' : 'no-disponible'}" onclick="handleToggleDisponible('${id}', '${disponible}')">
            ${disponible === "Sí" ? "Marcar No Disponible" : "Marcar Disponible"}
          </button>
          <button class="edit-turno" onclick="handleEditTurno('${id}', '${fecha}', '${hora}', '${nombre}', '${telefono}', '${disponible}')">
            Editar
          </button>
          <button class="delete-turno" onclick="handleDeleteTurno('${id}')">
            Eliminar
          </button>
        </td>
      `;
      lista.appendChild(row);

      // Tarjeta para móviles
      const card = document.createElement("div");
      card.className = "turno-card";
      card.innerHTML = `
        <p><strong>ID:</strong> ${id}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Hora:</strong> ${hora}</p>
        <p><strong>Estado:</strong> ${estado}</p>
        <p><strong>Cliente:</strong> <span class="editable-name" onclick="handleEditName('${id}', '${nombre}', '${disponible}')">${nombre || "—"}</span></p>
        <p><strong>Teléfono:</strong> ${telefono || "—"}</p>
        <div class="turno-actions">
          <button class="toggle-disponible ${disponible === 'Sí' ? 'disponible' : 'no-disponible'}" onclick="handleToggleDisponible('${id}', '${disponible}')">
            ${disponible === "Sí" ? "No Disponible" : "Disponible"}
          </button>
          <button class="edit-turno" onclick="handleEditTurno('${id}', '${fecha}', '${hora}', '${nombre}', '${telefono}', '${disponible}')">
            Editar
          </button>
          <button class="delete-turno" onclick="handleDeleteTurno('${id}')">
            Eliminar
          </button>
        </div>
      `;
      listaMobile.appendChild(card);
    });

    document.getElementById("admin-modal").classList.add("active");
  });
}

// Copiar alias al portapapeles
function copiarAlias() {
  const alias = document.getElementById("alias-text").textContent;
  navigator.clipboard.writeText(alias).then(() => {
    const button = document.querySelector(".copy-button");
    button.innerHTML = '<i class="fas fa-check mr-2"></i> Copiado';
    setTimeout(() => {
      button.innerHTML = '<i class="fas fa-copy mr-2"></i> Copiar alias';
    }, 2000);
  }).catch((err) => {
    console.error("Error al copiar alias:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo copiar el alias. Inténtalo de nuevo.",
      confirmButtonColor: "#facc15"
    });
  });
}

// Actualizar horarios disponibles para clientes
async function updateTimeSlots() {
  const fechaInput = document.getElementById("fecha");
  const horaSelect = document.getElementById("hora");
  const selectedDate = fechaInput.value;
  horaSelect.innerHTML = '<option value="" disabled selected>Selecciona una hora</option>';

  if (!selectedDate) {
    horaSelect.disabled = true;
    return;
  }

  const parsedDate = parseDMY(selectedDate);
  if (!parsedDate || isNaN(parsedDate)) {
    Swal.fire({
      icon: "warning",
      title: "Fecha inválida",
      text: "Por favor, selecciona una fecha válida.",
      confirmButtonColor: "#facc15"
    });
    fechaInput.value = "";
    horaSelect.disabled = true;
    return;
  }

  if (!diasHabilitados.includes(parsedDate.getDay())) {
    Swal.fire({
      icon: "warning",
      title: "Día no laborable",
      text: "Solo se pueden reservar turnos de martes a sábado.",
      confirmButtonColor: "#facc15"
    });
    fechaInput.value = "";
    horaSelect.disabled = true;
    return;
  }

  const formattedSelectedDate = formatDate(selectedDate);
  try {
    const querySnapshot = await db.collection("turnos")
      .where("fecha", "==", formattedSelectedDate)
      .where("Disponible", "==", "Sí")
      .get();
    const disponibles = [];
    querySnapshot.forEach((doc) => {
      disponibles.push(doc.data());
    });

    disponibles.sort((a, b) => a.hora.localeCompare(b.hora));

    disponibles.forEach((t) => {
      const option = document.createElement("option");
      option.value = t.hora || "";
      option.textContent = t.hora ? `${t.hora} (Disponible)` : "Hora no disponible";
      horaSelect.appendChild(option);
    });

    horaSelect.disabled = false;
    if (disponibles.length === 0) {
      horaSelect.innerHTML = '<option value="" disabled selected>No hay horarios disponibles para esta fecha. Intenta con otra.</option>';
      horaSelect.disabled = true;
    }
  } catch (error) {
    console.error("Error al cargar horarios disponibles: ", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los horarios. Inténtalo de nuevo.",
      confirmButtonColor: "#facc15"
    });
  }
}

// Manejar reserva de turno
async function reservarTurno(event) {
  event.preventDefault();
  const nombre = document.getElementById("nombre").value;
  const telefono = document.getElementById("telefono").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  if (!fecha || !hora) {
    Swal.fire({
      icon: "warning",
      title: "Faltan datos",
      text: "Por favor, selecciona una fecha y hora válidas.",
      confirmButtonColor: "#facc15"
    });
    return;
  }

  const parsedDate = parseDMY(fecha);
  if (!parsedDate || isNaN(parsedDate)) {
    Swal.fire({
      icon: "warning",
      title: "Fecha inválida",
      text: "Por favor, selecciona una fecha válida.",
      confirmButtonColor: "#facc15"
    });
    return;
  }

  const formattedDate = formatDate(fecha);
  try {
    const querySnapshot = await db.collection("turnos")
      .where("fecha", "==", formattedDate)
      .where("hora", "==", hora)
      .where("Disponible", "==", "Sí")
      .get();
    let turno = null;
    querySnapshot.forEach((doc) => {
      turno = { id: doc.id, ...doc.data() };
    });

    if (!turno) {
      Swal.fire({
        icon: "warning",
        title: "Horario no disponible",
        text: "El turno seleccionado ya no está disponible. Por favor, elige otro horario.",
        confirmButtonColor: "#facc15"
      });
      return;
    }

    await db.collection("turnos").doc(turno.id).update({
      nombre: nombre,
      telefono: telefono,
      Disponible: "No"
    });

    Swal.fire({
      icon: "success",
      title: "Turno reservado",
      text: "Tu turno ha sido reservado con éxito.",
      timer: 2000,
      showConfirmButton: false
    });
    document.getElementById("reserva-form").reset();
    document.getElementById("fecha").value = "";
    document.getElementById("hora").innerHTML = '<option value="" disabled selected>Selecciona una hora</option>';
    document.getElementById("hora").disabled = true;
    await updateTimeSlots();
  } catch (error) {
    console.error("Error al reservar turno: ", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo reservar el turno. Inténtalo de nuevo.",
      confirmButtonColor: "#facc15"
    });
  }
}

// Inicializar eventos y restricciones de fecha
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM completamente cargado");

  // Verificar elementos del DOM
  const adminLink = document.getElementById("admin-link");
  const adminLinkMobile = document.getElementById("admin-link-mobile");
  if (!adminLink) console.error("Elemento con ID 'admin-link' no encontrado");
  if (!adminLinkMobile) console.error("Elemento con ID 'admin-link-mobile' no encontrado");

  // Vincular eventos de los enlaces de administración
  if (adminLink) {
    adminLink.addEventListener("click", () => {
      console.log("Botón Admin clicado");
      mostrarPromptClave();
    });
  }
  if (adminLinkMobile) {
    adminLinkMobile.addEventListener("click", () => {
      console.log("Botón Admin móvil clicado");
      mostrarPromptClave();
    });
  }

  const fechaInput = document.getElementById("fecha");
  const horaSelect = document.getElementById("hora");
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 1);

  fechaInput.min = formatDateToISO(minDate);

  fechaInput.addEventListener("change", async (e) => {
    const selectedDate = parseDMY(e.target.value);
    if (!selectedDate || isNaN(selectedDate)) {
      Swal.fire({
        icon: "warning",
        title: "Fecha inválida",
        text: "Por favor, selecciona una fecha válida.",
        confirmButtonColor: "#facc15"
      });
      e.target.value = "";
      horaSelect.disabled = true;
      horaSelect.innerHTML = '<option value="" disabled selected>Selecciona una hora</option>';
      return;
    }

    const dayOfWeek = selectedDate.getDay();
    if (!diasHabilitados.includes(dayOfWeek)) {
      Swal.fire({
        icon: "warning",
        title: "Día no laborable",
        text: "Solo se pueden reservar turnos de martes a sábado.",
        confirmButtonColor: "#facc15"
      });
      e.target.value = "";
      horaSelect.disabled = true;
      horaSelect.innerHTML = '<option value="" disabled selected>Selecciona una hora</option>';
      return;
    }

    await updateTimeSlots();
  });

  horaSelect.disabled = true;

  // Vincular botones de administración
  document.getElementById("generarTurnos").addEventListener("click", generarTurnos);
  document.getElementById("refreshTurnos").addEventListener("click", mostrarTurnosAdmin);
  document.getElementById("exportTurnos").addEventListener("click", exportTurnos);
  document.getElementById("importTurnos").addEventListener("click", importTurnos);
  document.getElementById("logout").addEventListener("click", logout);

  // Cerrar modal de administración
  document.querySelector("#admin-modal .close-modal").addEventListener("click", () => {
    document.getElementById("admin-modal").classList.remove("active");
  });
});

// Toggle menú móvil
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
menuToggle.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden");
  mobileMenu.classList.toggle("active");
  menuToggle.innerHTML = mobileMenu.classList.contains("hidden") ? '<i class="fas fa-bars text-2xl"></i>' : '<i class="fas fa-times text-2xl"></i>';
});

// Cerrar menú móvil al hacer clic en un enlace
document.querySelectorAll("#mobile-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.add("hidden");
    mobileMenu.classList.remove("active");
    menuToggle.innerHTML = '<i class="fas fa-bars text-2xl"></i>';
  });
});

// Desplazamiento suave para enlaces de anclaje
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    if (this.id !== "admin-link" && this.id !== "admin-link-mobile") {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      const headerHeight = document.querySelector("header").offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth"
      });
    }
  });
});
