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

// Function to handle student check-in
async function handleMarkAttendance(request) {
  try {
    const data = await request.json();
    const { sessionId, studentName, studentId } = data;

    if (!sessionId || !studentName || !studentId) {
      return new Response(JSON.stringify({ status: 'error', message: 'Missing parameters' }), { status: 400 });
    }

    // Check if the student has already checked in for the session
    const existingAttendance = await ATTENDANCE.get(`${sessionId}-${studentId}`);
    if (existingAttendance) {
      return new Response(JSON.stringify({ status: 'already marked', message: 'You have already checked in' }), { status: 403 });
    }

    // Store the student's attendance in the KV Namespace
    await ATTENDANCE.put(`${sessionId}-${studentId}`, JSON.stringify({ studentName, studentId }));
    return new Response(JSON.stringify({ status: 'success', message: 'Check-in successful' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ status: 'error', message: 'Server error', details: error.message }), { status: 500 });
  }
}

// Function to retrieve the list of students who have checked in for a session
async function handleGetAttendanceList(request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(JSON.stringify({ status: 'error', message: 'Missing sessionId parameter' }), { status: 400 });
    }

    const keys = await ATTENDANCE.list({ prefix: sessionId });
    const attendanceData = await Promise.all(
      keys.keys.map(async key => JSON.parse(await ATTENDANCE.get(key.name)))
    );

    return new Response(JSON.stringify({ status: 'success', data: attendanceData }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ status: 'error', message: 'Server error', details: error.message }), { status: 500 });
  }
}
