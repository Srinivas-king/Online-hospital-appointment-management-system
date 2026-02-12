
const baseUrl = 'http://localhost:5001/api';
import fs from 'fs';

async function test() {
    let log = '';
    const addLog = (msg) => {
        console.log(msg);
        log += msg + '\n';
    };

    try {
        addLog('Testing Registration...');
        const email = 'testpatient' + Date.now() + '@gmail.com';
        const regResp = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Patient',
                email: email,
                password: 'password123',
                phone: '1234567890'
            })
        });
        const regData = await regResp.json();
        addLog(`Reg Status: ${regResp.status}`);
        addLog(`Reg Response: ${JSON.stringify(regData)}`);

        if (regResp.ok) {
            addLog('Testing Login...');
            const loginResp = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: 'password123'
                })
            });
            const loginData = await loginResp.json();
            addLog(`Login Status: ${loginResp.status}`);
            addLog(`Login Response: ${JSON.stringify(loginData)}`);

            if (loginResp.ok) {
                const token = loginData.token;
                addLog('Testing Get Appointments...');
                const appResp = await fetch(`${baseUrl}/appointments/patient`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const appData = await appResp.json();
                addLog(`Appointments Status: ${appResp.status}`);
                addLog(`Appointments Response: ${JSON.stringify(appData)}`);

                addLog('Testing Booking...');
                const bookResp = await fetch(`${baseUrl}/appointments/book`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        fullName: 'Test Patient',
                        age: 25,
                        email: email,
                        phone: '1234567890',
                        gender: 'male',
                        department: 'Cardiology',
                        appointmentDate: '2026-03-01',
                        appointmentTime: '10:00 AM',
                        reason: 'Regular checkup',
                        slotId: 0
                    })
                });
                const bookData = await bookResp.json();
                addLog(`Book Status: ${bookResp.status}`);
                addLog(`Book Response: ${JSON.stringify(bookData)}`);

                if (bookResp.ok) {
                    addLog('Verifying appointment in dashboard...');
                    const verifyResp = await fetch(`${baseUrl}/appointments/patient`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const verifyData = await verifyResp.json();
                    addLog(`Dashboard Update Status: ${verifyResp.status}`);
                    addLog(`Dashboard Update Content: ${JSON.stringify(verifyData)}`);
                }
            }
        }

        addLog('Testing Admin Login...');
        const adminLoginResp = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@gmail.com',
                password: 'Admin@123'
            })
        });
        const adminLoginData = await adminLoginResp.json();
        addLog(`Admin Login Status: ${adminLoginResp.status}`);
        addLog(`Admin Login Response: ${JSON.stringify(adminLoginData)}`);

        if (adminLoginResp.ok) {
            addLog('Testing Admin Get All Appointments...');
            const adminAppResp = await fetch(`${baseUrl}/appointments/all`, {
                headers: { 'Authorization': `Bearer ${adminLoginData.token}` }
            });
            addLog(`Admin All Apps Status: ${adminAppResp.status}`);
            const adminAppData = await adminAppResp.json();
            addLog(`Admin All Apps Count: ${adminAppData.length}`);
        }

    } catch (err) {
        addLog(`TEST ERROR: ${err.message}`);
    } finally {
        fs.writeFileSync('test-audit-results.txt', log);
    }
}

test();
