document.addEventListener('DOMContentLoaded', () => {
    const feedbackTableBody = document.getElementById('feedback-table-body');
    const accessLogTableBody = document.getElementById('access-log-table-body');
    const themeChartCanvas = document.getElementById('themeChart');
    let themeChart = null;

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function renderFeedbackTable(feedbackData) {
        feedbackTableBody.innerHTML = '';
        if (feedbackData.length === 0) {
            feedbackTableBody.innerHTML = '<tr><td colspan="2">Belum ada saran.</td></tr>';
            return;
        }
        feedbackData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatTimestamp(item.timestamp)}</td>
                <td>${item.suggestion}</td>
            `;
            feedbackTableBody.appendChild(row);
        });
    }

    function renderAccessLogTable(logData) {
        accessLogTableBody.innerHTML = '';
        if (logData.length === 0) {
            accessLogTableBody.innerHTML = '<tr><td colspan="3">Belum ada akses tercatat.</td></tr>';
            return;
        }
        logData.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatTimestamp(log.timestamp)}</td>
                <td>${log.player_name}</td>
                <td>${log.theme}</td>
            `;
            accessLogTableBody.appendChild(row);
        });
    }

    function renderThemeChart(popularityData) {
        if (themeChart) {
            themeChart.destroy();
        }

        const labels = popularityData.map(item => item.theme);
        const data = popularityData.map(item => item.count);

        const backgroundColors = [
            '#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6c757d', '#6610f2'
        ];

        themeChart = new Chart(themeChartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jumlah Dimainkan',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += `${context.parsed} kali`;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    async function fetchDashboardData() {
        try {
            const response = await fetch('/api/dashboard-data');
            if (!response.ok) {
                throw new Error('Gagal mengambil data dashboard');
            }
            const data = await response.json();

            renderFeedbackTable(data.feedback);
            renderAccessLogTable(data.access_logs);
            renderThemeChart(data.theme_popularity);

        } catch (error) {
            console.error(error);
            // Tampilkan pesan error di halaman
        }
    }

    fetchDashboardData();
});