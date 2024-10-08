// Function to handle student check-in.
async function handleMarkAttendance(request) {
  try {
    const data = await request.json();
    const { sessionId, studentName, studentId } = data;

    console.log(`Received check-in request: sessionId=${sessionId}, studentName=${studentName}, studentId=${studentId}`);

    if (!sessionId || !studentName || !studentId) {
      console.log('Error: Missing parameters');
      return new Response(JSON.stringify({ status: 'error', message: 'Please provide all required details: sessionId, student name, and student ID.' }), { status: 400 });
    }

    // Check if the student has already checked in for the session
    const existingAttendance = await ATTENDANCE.get(`${sessionId}-${studentId}`);
    console.log(`Existing attendance check for studentId=${studentId}: ${existingAttendance}`);

    if (existingAttendance) {
      console.log(`Student ${studentId} has already checked in for session ${sessionId}`);
      return new Response(JSON.stringify({ status: 'already_marked', message: 'You have already checked in for this session.' }), { status: 403 });
    }

    // Store the student's attendance in the KV Namespace
    await ATTENDANCE.put(`${sessionId}-${studentId}`, JSON.stringify({ studentName, studentId }));
    console.log(`Student ${studentId} successfully checked in for session ${sessionId}`);
    return new Response(JSON.stringify({ status: 'success', message: 'Check-in successful!' }), { status: 200 });
  } catch (error) {
    console.error('Error during attendance check-in:', error);
    return new Response(JSON.stringify({ status: 'error', message: 'There was a server error. Please try again later.', details: error.message }), { status: 500 });
  }
}
