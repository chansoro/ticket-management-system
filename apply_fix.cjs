const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');

// 1. Fix Admin Tickets.tsx (Fixes "\${t.id}" UUID bug)
const adminTicketsPath = path.join(frontendDir, 'src/pages/admin/Tickets.tsx');
if (fs.existsSync(adminTicketsPath)) {
  let content = fs.readFileSync(adminTicketsPath, 'utf8');
  content = content.replace(/to=\{\`\/admin\/tickets\/\$\{t\.id\}\`\}/g, "to={'/admin/tickets/' + t.id}");
  content = content.replace(/to="\/admin\/tickets\/\$\{t\.id\}"/g, "to={'/admin/tickets/' + t.id}");
  content = content.replace(/to=\{"\/admin\/tickets\/\$\{t\.id\}"\}/g, "to={'/admin/tickets/' + t.id}");
  fs.writeFileSync(adminTicketsPath, content, 'utf8');
  console.log('Fixed Admin Tickets.tsx');
}

// 2. Fix Developer Detail & Activity Timeline
const devDetailPath = path.join(frontendDir, 'src/pages/developer/TicketDetail.tsx');
if (fs.existsSync(devDetailPath)) {
  let content = fs.readFileSync(devDetailPath, 'utf8');
  content = content.replace(/\$\{ticket\.requestor\}/g, "' + ticket.requestor + '");
  content = content.replace(/\$\{ticket\.assignedTo\}/g, "' + (ticket.assignedTo || 'Developer') + '");
  fs.writeFileSync(devDetailPath, content, 'utf8');
  console.log('Fixed Developer TicketDetail.tsx');
}

// 3. Fix Admin Reports.tsx (CSV filename and variables)
const reportsPath = path.join(frontendDir, 'src/pages/admin/Reports.tsx');
if (fs.existsSync(reportsPath)) {
  let content = fs.readFileSync(reportsPath, 'utf8');
  content = content.replace(/\$\{selectedYear\}/g, "' + selectedYear + '");
  content = content.replace(/\$\{safeName\}/g, "' + safeScopeName + '");
  content = content.replace(/Official Academic Audit Ledger/g, 'Official Audit Ledger');
  fs.writeFileSync(reportsPath, content, 'utf8');
  console.log('Fixed Admin Reports.tsx');
}

// 4. Fix Developer & Requestor Ticket Route in Tables
const devTicketsPath = path.join(frontendDir, 'src/pages/developer/MyTickets.tsx');
if (fs.existsSync(devTicketsPath)) {
  let content = fs.readFileSync(devTicketsPath, 'utf8');
  content = content.replace(/detailRoute=\{.*?\}\}/g, "detailRoute={(id) => '/developer/tickets/' + id}");
  fs.writeFileSync(devTicketsPath, content, 'utf8');
  console.log('Fixed Developer MyTickets.tsx');
}