addEventListener('fetch', event => {
    const { request } = event;
    if (request.method === 'POST' && request.url.includes('/api/mark-attendance')) {
      event.respondWith(handleMarkAttendance(request));
    } else if (request.method === 'GET' && request.url.includes('/api/get-attendance-list')) {
      event.respondWith(handleGetAttendanceList(request));
    } else {
      event.respondWith(new Response('Not found', { status: 404 }));
    }
  });
  
  async function handleMarkAttendance(request) {
    const data = await request.json();
    const { sessionId, studentName, studentId } = data;
  
    const existingAttendance = await ATTENDANCE.get(`${sessionId}-${studentId}`);
    if (existingAttendance) {
      return new Response(JSON.stringify({ status: 'already marked' }), { status: 403 });
    }
  
    await ATTENDANCE.put(`${sessionId}-${studentId}`, JSON.stringify({ studentName, studentId }));
    return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
  }
  
  async function handleGetAttendanceList(request) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const keys = await ATTENDANCE.list({ prefix: sessionId });
    const attendanceData = keys.keys.map(key => JSON.parse(ATTENDANCE.get(key.name)));
    return new Response(JSON.stringify(attendanceData), { status: 200 });
  }
  