export class ChartManager {
    constructor() {
        this.charts = {};
    }

    init() {
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/chart.js";
            script.onload = () => this.createCharts();
            document.head.appendChild(script);
        } else {
            this.createCharts();
        }
    }

    createCharts() {
        this.createLocationChart();
        this.createGenderChart();
    }

    createLocationChart() {
        const canvas = document.getElementById('location-chart');
        if (!canvas) return;

        this.charts.location = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Bauch (80%)', 'Brust (20%)'],
                datasets: [{ 
                    data: [80, 20], 
                    backgroundColor: ['#ff4444', '#555'],
                    borderColor: 'rgba(0,0,0,0)'
                }]
            },
            options: { 
                responsive: true, 
                plugins: { 
                    title: { display: true, text: 'Lokalisation (AAA vs TAA)', color: '#fff', font: { size: 14 } },
                    legend: { labels: { color: '#fff' } } 
                } 
            }
        });
    }

    createGenderChart() {
        const canvas = document.getElementById('gender-chart');
        if (!canvas) return;

        this.charts.gender = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Männer (80%)', 'Frauen (20%)'],
                datasets: [{ 
                    data: [80, 20], 
                    backgroundColor: ['#00d4ff', '#ff4444'],
                    borderColor: 'rgba(0,0,0,0)'
                }]
            },
            options: { 
                responsive: true, 
                plugins: { 
                    title: { display: true, text: 'Geschlechterverteilung', color: '#fff', font: { size: 14 } },
                    legend: { labels: { color: '#fff' } } 
                } 
            }
        });
    }
}
