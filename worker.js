export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === '/api/mark-attendance' && request.method === 'POST') {
      return await env.ATTENDANCE_OBJECT.fetch(request);
    } else if (pathname === '/api/get-attendance-list' && request.method === 'GET') {
      return await env.ATTENDANCE_OBJECT.fetch(request);
    } else {
      return new Response('Not found', { status: 404 });
    }
  }
}

export class AttendanceDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === '/api/mark-attendance' && request.method === 'POST') {
      const { sessionId, studentName, studentId } = await request.json();
      const attendanceList = await this.state.storage.get(sessionId) || [];
      
      // Check if student has already checked in
      if (attendanceList.some(student => student.studentId === studentId)) {
        return new Response(JSON.stringify({ status: 'already_marked', message: 'You have already checked in.' }), { status: 403 });
      }

      attendanceList.push({ studentName, studentId });
      await this.state.storage.put(sessionId, attendanceList);
      return new Response(JSON.stringify({ status: 'success', message: 'Check-in successful!' }), { status: 200 });
    }

    if (pathname === '/api/get-attendance-list' && request.method === 'GET') {
      const sessionId = url.searchParams.get('sessionId');
      const attendanceList = await this.state.storage.get(sessionId) || [];
      return new Response(JSON.stringify({ status: 'success', data: attendanceList }), { status: 200 });
    }

    return new Response('Not found', { status: 404 });
  }
}
