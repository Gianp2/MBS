/* Tailwind CSS import */
@import 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';

/* Estilos específicos para el panel de administración */
#admin-modal {
  @apply fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50;
}

#admin-modal .modal-content {
  @apply bg-gray-800 text-gray-200 rounded-lg shadow-2xl p-6 w-full max-w-4xl mx-4 overflow-y-auto max-h-[90vh];
}

#admin-modal .close-modal {
  @apply absolute top-4 right-4 text-gray-200 hover:text-yellow-400 text-2xl;
}

.admin-buttons {
  @apply flex flex-wrap justify-center gap-4 mb-6;
}

.admin-buttons button {
  @apply bg-yellow-400 text-gray-900 font-semibold font-['Poppins'] py-3 px-6 rounded-lg hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105 min-w-[120px] text-base;
}

#filtroFecha {
  @apply w-full sm:w-auto p-3 border border-gray-600 rounded-lg bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-4;
}

#listaTurnosAdmin {
  @apply w-full border-collapse;
}

#listaTurnosAdmin th, #listaTurnosAdmin td {
  @apply border border-gray-600 p-3 text-left;
}

#listaTurnosAdmin th {
  @apply bg-gray-700 font-semibold;
}

.turno-card {
  @apply bg-gray-700 p-4 rounded-lg mb-4;
}

.turno-actions {
  @apply flex flex-wrap gap-2 mt-2;
}

.toggle-disponible.disponible {
  @apply bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600;
}

.toggle-disponible.no-disponible {
  @apply bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600;
}

.edit-turno {
  @apply bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600;
}

.delete-turno {
  @apply bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700;
}

.editable-name {
  @apply cursor-pointer hover:underline;
}

@media (max-width: 640px) {
  .admin-buttons {
    @apply flex-col items-center;
  }
  .admin-buttons button {
    @apply w-full max-w-xs;
  }
  #filtroFecha {
    @apply w-full;
  }
}
