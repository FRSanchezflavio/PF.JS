let registros = [];

const form = document.getElementById('salidaForm');
const listaRegistros = document.getElementById('listaRegistros');

function simularRetardo(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function agregarRegistro() {
  const nombre = document.getElementById('nombre').value ?? 'Anónimo';
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;
  const motivo = document.getElementById('motivo').value || 'Sin especificar';

  const registro = { id: Date.now(), nombre, fecha, hora, motivo };

  try {
    await simularRetardo(1000);
    registros = [...registros, registro];
    await guardarRegistros();
    await mostrarRegistros();
    await actualizarGrafico();
    await enviarRegistroAlServidor(registro);
    form.reset();
    console.log('Registro agregado con éxito');
  } catch (error) {
    console.error('Error al agregar el registro:', error);
  }
}

async function mostrarRegistros() {
  await simularRetardo(500);
  const registrosHTML = registros
    .map(
      registro => `
        <li>
            <strong>${registro.nombre}</strong> - ${registro.fecha} ${
        registro.hora
      }
            <br>Motivo: ${registro.motivo}
            <button onclick="eliminarRegistro(${registro.id})">
                ${registro.motivo === 'Sin especificar' ? 'Eliminar' : 'Borrar'}
            </button>
        </li>
    `
    )
    .join('');

  listaRegistros.innerHTML = registrosHTML || '<li>No hay registros</li>';
}

async function eliminarRegistro(id) {
  try {
    await simularRetardo(800);
    registros = registros.filter(registro => registro.id !== id);
    await guardarRegistros();
    await mostrarRegistros();
    await actualizarGrafico();
    console.log('Registro eliminado con éxito');
  } catch (error) {
    console.error('Error al eliminar el registro:', error);
  }
}

async function guardarRegistros() {
  await simularRetardo(300);
  localStorage.setItem('registros', JSON.stringify(registros));
}

async function cargarRegistros() {
  try {
    await simularRetardo(1000);
    const registrosGuardados = localStorage.getItem('registros');
    registros = registrosGuardados ? JSON.parse(registrosGuardados) : [];
    await mostrarRegistros();
    await actualizarGrafico();
    await mostrarInfoUsuarioYPosts();
    console.log('Registros cargados con éxito');
  } catch (error) {
    console.error('Error al cargar los registros:', error);
  }
}

async function buscarPorNombre(nombre = '') {
  await simularRetardo(500);
  return registros.filter(registro =>
    registro.nombre.toLowerCase().includes((nombre ?? '').toLowerCase())
  );
}

async function registrosPorFecha(fecha) {
  await simularRetardo(500);
  return registros.filter(
    ({ fecha: fechaRegistro }) => fechaRegistro === fecha
  );
}

async function totalSalidasPorPersona() {
  await simularRetardo(700);
  return registros.reduce((acc, { nombre }) => {
    acc[nombre] = (acc[nombre] ?? 0) + 1;
    return acc;
  }, {});
}

async function motivosMasComunes() {
  await simularRetardo(600);
  const motivos = registros.reduce((acc, { motivo }) => {
    acc[motivo] = (acc[motivo] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(motivos)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
}

async function actualizarGrafico() {
  const ctx = document.getElementById('graficoSalidas');
  if (!ctx) {
    console.error('Elemento del gráfico no encontrado');
    return;
  }

  const datos = await totalSalidasPorPersona();

  new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: Object.keys(datos),
      datasets: [
        {
          label: 'Número de Salidas',
          data: Object.values(datos),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          stepSize: 1,
        },
      },
      plugins: {
        title: {
          display: true,
          text: 'Total de Salidas por Persona',
        },
      },
    },
  });
}

function obtenerUsuarioAjax(id) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `https://jsonplaceholder.typicode.com/users/${id}`, true);
    xhr.onload = function () {
      if (this.status === 200) {
        resolve(JSON.parse(this.responseText));
      } else {
        reject(new Error(`Error en la solicitud: ${this.status}`));
      }
    };
    xhr.onerror = function () {
      reject(new Error('Error de red'));
    };
    xhr.send();
  });
}

async function obtenerPosts() {
  try {
    const response = await fetch(
      'https://jsonplaceholder.typicode.com/posts?_limit=5'
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error al obtener posts:', error);
    return [];
  }
}

async function mostrarInfoUsuarioYPosts() {
  try {
    const usuario = await obtenerUsuarioAjax(1);
    const posts = await obtenerPosts();

    const infoHTML = `
      <h3>Información del Usuario (Ajax)</h3>
      <p>Nombre: ${usuario.name}</p>
      <p>Email: ${usuario.email}</p>
      <h3>Posts Recientes (Fetch)</h3>
      <ul>
          ${posts.map(post => `<li>${post.title}</li>`).join('')}
      </ul>
    `;

    const infoContainer = document.createElement('div');
    infoContainer.innerHTML = infoHTML;
    document.querySelector('.container').appendChild(infoContainer);
  } catch (error) {
    console.error('Error al mostrar información:', error);
  }
}

async function enviarRegistroAlServidor(registro) {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify(registro),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Registro enviado al servidor:', data);
  } catch (error) {
    console.error('Error al enviar registro al servidor:', error);
  }
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  await agregarRegistro();
});

cargarRegistros()
  .then(() => console.log('Aplicación inicializada'))
  .catch(error => console.error('Error al inicializar la aplicación:', error));
