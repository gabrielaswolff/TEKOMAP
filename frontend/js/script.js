// index.html

// Inicialização do mapa
const map = L.map('map').setView([-29.5, -53], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Variáveis globais
let markersLayer = L.layerGroup().addTo(map);
let allTerritories = [];

// Função para criar marcador personalizado
function createMarker(feature, latlng) {
    const iconHtml = `
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 16 16" class="custom-marker">
          <path fill="#cd483e" d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10"/>
          <circle cx="8" cy="6" r="3" fill="#b31412"/>
        </svg>
      `;

    const customIcon = L.divIcon({
        className: '',
        html: iconHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });

    const marker = L.marker(latlng, { icon: customIcon });

    const props = feature.properties || {};
    let conteudoPopup = `
        <strong>${props.nome || 'Sem nome'}</strong><br>
        ${props.populacao ? `População: ${props.populacao}<br>` : ""}
        ${props.etnia ? `Etnia: ${props.etnia}<br>` : ""}
        ${props.area_ha ? `Área: ${props.area_ha} ha` : ""}
      `;

    marker.bindPopup(conteudoPopup);
    return marker;
}

// Função para mostrar todos os territórios
function showAllTerritories() {
    markersLayer.clearLayers();
    allTerritories.forEach(territory => {
        const marker = createMarker(territory, L.latLng(
            territory.geometry.coordinates[1],
            territory.geometry.coordinates[0]
        ));
        markersLayer.addLayer(marker);
    });
}

// Função para filtrar territórios
function filterTerritories(searchTerm) {
    if (!searchTerm) {
        showAllTerritories();
        return;
    }

    markersLayer.clearLayers();
    const searchLower = searchTerm.toLowerCase();

    const filtered = allTerritories.filter(territory => {
        const props = territory.properties || {};
        return (
            (props.nome && props.nome.toLowerCase().includes(searchLower)) ||
            (props.etnia && props.etnia.toLowerCase().includes(searchLower))
        );
    });

    // Adiciona marcadores filtrados
    filtered.forEach(territory => {
        const marker = createMarker(territory, L.latLng(
            territory.geometry.coordinates[1],
            territory.geometry.coordinates[0]
        ));
        markersLayer.addLayer(marker);

        // Abre popup automaticamente se houver apenas um resultado
        if (filtered.length === 1) {
            marker.openPopup();
        }
    });

    // Ajusta o zoom para mostrar todos os resultados
    if (filtered.length > 0) {
        const bounds = L.latLngBounds(
            filtered.map(t => [t.geometry.coordinates[1], t.geometry.coordinates[0]])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
    } else {
        alert("Nenhum território encontrado com esse critério de busca.");
    }
}

// Carregar dados GeoJSON
function loadTerritories() {
    fetch('/frontend/terras-rs.geojson')
        .then(response => {
            if (!response.ok) throw new Error("Arquivo GeoJSON não encontrado");
            return response.json();
        })
        .then(geojson => {
            allTerritories = geojson.features;
            showAllTerritories();
        })
        .catch(error => {
            console.error("Erro ao carregar GeoJSON:", error);
            alert("Erro ao carregar os dados dos territórios.");
        });
}

// Mostrar coordenadas com o mouse
function setupCoordinateDisplay() {
    const coordBox = document.getElementById('coordenadas');
    map.on('mousemove', function (e) {
        const lat = e.latlng.lat.toFixed(5);
        const lng = e.latlng.lng.toFixed(5);
        coordBox.innerText = `Lat: ${lat}, Lng: ${lng}`;
    });
}

// Mostrar coordenadas ao clicar no mapa
function setupClickCoordinates() {
    map.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(5);
        const lng = e.latlng.lng.toFixed(5);

        const existente = document.querySelector('.notificacao-coordenada');
        if (existente) existente.remove();

        const notificacao = document.createElement('div');
        notificacao.className = 'notificacao-coordenada';
        notificacao.innerHTML = `
          <button class="fechar" onclick="this.parentElement.remove()">&times;</button>
          <strong>Coordenadas:</strong><br>
          Latitude: ${lat}<br>
          Longitude: ${lng}
        `;

        document.body.appendChild(notificacao);
    });
}

// Configurar eventos de busca
function setupSearchEvents() {
    document.getElementById('searchButton').addEventListener('click', function () {
        const searchTerm = document.getElementById('searchInput').value.trim();
        filterTerritories(searchTerm);
    });

    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const searchTerm = document.getElementById('searchInput').value.trim();
            filterTerritories(searchTerm);
        }
    });

    document.getElementById('resetButton').addEventListener('click', function () {
        document.getElementById('searchInput').value = '';
        showAllTerritories();
        map.setView([-29.5, -53], 7);
    });
}

// Inicialização da aplicação
function init() {
    setupCoordinateDisplay();
    setupClickCoordinates();
    setupSearchEvents();
    loadTerritories();
}

// Inicia a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', init);