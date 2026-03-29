import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
});

async function checkData() {
    try {
        const res = await api.get('turmas/?page_size=5000');
        console.log('Turmas Count:', res.data.count || res.data.length);
        console.log('Turmas Results Length:', (res.data.results || res.data).length);
        
        const resAlunos = await api.get('alunos/?page_size=5000');
        console.log('Alunos Count:', resAlunos.data.count || resAlunos.data.length);

        const resInscritos = await api.get('candidaturas/?page_size=5000');
        console.log('Inscritos Count:', resInscritos.data.count || resInscritos.data.length);

    } catch (e) {
        console.error('Error fetching data:', e.message);
    }
}

checkData();
