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

// Function to handle student check-in.
async function handleMarkAttendance(request) {
  try {
    const data = await request.json();
    const { sessionId, studentName, studentId } = data;

    console.log(`Received check-in request: sessionId=${sessionId}, studentName=${studentName}, studentId=${studentId}`);

    if (!sessionId || !studentName || !studentId) {
      console.log('Error: Missing parameters');
      return new Response(JSON.stringify({ status: 'error', message: 'Missing parameters' }), { status: 400 });
    }

    // Check if the student has already checked in for the session
    const existingAttendance = await ATTENDANCE.get(`${sessionId}-${studentId}`);
    console.log(`Existing attendance check for studentId=${studentId}: ${existingAttendance}`);

    if (existingAttendance) {
      console.log(`Student ${studentId} has already checked in for session ${sessionId}`);
      return new Response(JSON.stringify({ status: 'already marked', message: 'You have already checked in' }), { status: 403 });
    }

    // Store the student's attendance in the KV Namespace
    await ATTENDANCE.put(`${sessionId}-${studentId}`, JSON.stringify({ studentName, studentId }));
    console.log(`Student ${studentId} successfully checked in for session ${sessionId}`);
    return new Response(JSON.stringify({ status: 'success', message: 'Check-in successful' }), { status: 200 });
  } catch (error) {
    console.error('Error during attendance check-in:', error);
    return new Response(JSON.stringify({ status: 'error', message: 'Server error', details: error.message }), { status: 500 });
  }
}

// Function to retrieve the list of students who have checked in for a session
async function handleGetAttendanceList(request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    console.log(`Retrieving attendance list for sessionId=${sessionId}`);

    if (!sessionId) {
      console.log('Error: Missing sessionId parameter');
      return new Response(JSON.stringify({ status: 'error', message: 'Missing sessionId parameter' }), { status: 400 });
    }

    // Retrieve all keys related to the session from the KV Namespace
    const keys = await ATTENDANCE.list({ prefix: sessionId });
    console.log(`Keys found for sessionId=${sessionId}: ${JSON.stringify(keys.keys)}`);

    const attendanceData = await Promise.all(
      keys.keys.map(async key => {
        const data = await ATTENDANCE.get(key.name);
        console.log(`Data retrieved for key=${key.name}: ${data}`);
        return JSON.parse(data);
      })
    );

    console.log(`Attendance data for sessionId=${sessionId}: ${JSON.stringify(attendanceData)}`);
    return new Response(JSON.stringify({ status: 'success', data: attendanceData }), { status: 200 });
  } catch (error) {
    console.error('Error during attendance list retrieval:', error);
    return new Response(JSON.stringify({ status: 'error', message: 'Server error', details: error.message }), { status: 500 });
  }
}
