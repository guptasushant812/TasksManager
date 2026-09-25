import 'dotenv/config';
import mongoose from 'mongoose';
import Task, { getNextTaskId } from '../models/Task';
import { connectDB } from '../config/db';

const SAMPLE_TASKS = [
  {
    title: 'Attach 2 Notices to the Department Communication ISO File',
    description: 'Working on Saturday 22.08.2026 and Reporting time on attendance.pdf',
    givenBy: 'Sachin Oak',
    priority: 'High' as const,
    workStatus: 'Pending' as const,
    reason: 'Waiting for ISO committee approval',
    remarks: '',
    date: new Date('2026-08-22'),
    dueDate: new Date('2026-08-30'),
  },
  {
    title: 'NBA Committee Visit Scheduled',
    description: 'NBA Committee Visit Scheduled during 28th to 30th - 260820 191733.pdf - Pending. Given by Sachin Oak sir given date 10-07-2026',
    givenBy: 'Sachin Oak',
    priority: 'High' as const,
    workStatus: 'InProgress' as const,
    reason: 'Coordinating with NBA committee members for visit schedule',
    remarks: '',
    date: new Date('2026-07-10'),
    dueDate: new Date('2026-08-28'),
  },
  {
    title: 'Update Annual Report Q2 Data',
    description: 'Compile and update all Q2 financial and operational data into the annual report template.',
    givenBy: 'Director',
    priority: 'Medium' as const,
    workStatus: 'Completed' as const,
    reason: '',
    remarks: 'Report updated and submitted to management on 14-08-2026.',
    date: new Date('2026-08-10'),
    dueDate: new Date('2026-08-15'),
  },
  {
    title: 'Prepare Department Training Schedule',
    description: 'Prepare a complete training schedule for Q3 for all department staff including dates, topics, and trainers.',
    givenBy: 'HR Manager',
    priority: 'Medium' as const,
    workStatus: 'Pending' as const,
    reason: 'Awaiting trainer availability confirmation',
    remarks: '',
    date: new Date('2026-09-01'),
    dueDate: new Date('2026-09-15'),
  },
  {
    title: 'Review and Sign MOU with Partner Institute',
    description: 'Review the Memorandum of Understanding document with XYZ Institute and get it signed by the principal.',
    givenBy: 'Principal',
    priority: 'High' as const,
    workStatus: 'InProgress' as const,
    reason: 'Legal team reviewing the clauses',
    remarks: '',
    date: new Date('2026-09-05'),
    dueDate: new Date('2026-09-20'),
  },
  {
    title: 'Update Student Database for New Admissions',
    description: 'Enter all new student admission records into the management system with complete details.',
    givenBy: 'Admission Cell',
    priority: 'High' as const,
    workStatus: 'InProgress' as const,
    reason: 'Data entry in progress, 60% completed',
    remarks: '',
    date: new Date('2026-09-08'),
    dueDate: new Date('2026-09-12'),
  },
  {
    title: 'Organize Faculty Meeting Minutes',
    description: 'Compile and distribute minutes of the faculty meeting held on 01-09-2026.',
    givenBy: 'Dean',
    priority: 'Low' as const,
    workStatus: 'Completed' as const,
    reason: '',
    remarks: 'Minutes compiled, reviewed, and emailed to all faculty on 03-09-2026.',
    date: new Date('2026-09-01'),
    dueDate: null,
  },
  {
    title: 'Prepare Budget Estimate for Lab Equipment',
    description: 'Prepare detailed budget estimate for purchase of new lab equipment for CSE department.',
    givenBy: 'HOD CSE',
    priority: 'Medium' as const,
    workStatus: 'Pending' as const,
    reason: 'Vendor quotations pending',
    remarks: '',
    date: new Date('2026-09-10'),
    dueDate: new Date('2026-09-25'),
  },
  {
    title: 'Submit NAAC Self-Study Report Section 4',
    description: 'Complete and submit Section 4 of the NAAC SSR covering infrastructure and learning resources.',
    givenBy: 'IQAC Coordinator',
    priority: 'High' as const,
    workStatus: 'InProgress' as const,
    reason: 'Collecting data from individual departments',
    remarks: '',
    date: new Date('2026-09-12'),
    dueDate: new Date('2026-09-30'),
  },
  {
    title: 'Coordinate Sports Day Event',
    description: 'Plan and coordinate all activities for Annual Sports Day including venue booking, event schedule, and refreshments.',
    givenBy: 'Physical Director',
    priority: 'Medium' as const,
    workStatus: 'Pending' as const,
    reason: 'Venue booking confirmation pending',
    remarks: '',
    date: new Date('2026-09-15'),
    dueDate: new Date('2026-10-10'),
  },
  {
    title: 'Audit Internal Examination Paper Setting Process',
    description: 'Review the examination paper setting and moderation process for mid-semester examinations.',
    givenBy: 'Controller of Examinations',
    priority: 'High' as const,
    workStatus: 'Completed' as const,
    reason: '',
    remarks: 'Audit completed. Report submitted with 3 recommendations on 10-09-2026.',
    date: new Date('2026-09-07'),
    dueDate: new Date('2026-09-10'),
  },
  {
    title: 'Update Website with New Course Information',
    description: 'Update the college website with newly approved courses for 2026-27 academic year.',
    givenBy: 'IT Department',
    priority: 'Low' as const,
    workStatus: 'Pending' as const,
    reason: 'Awaiting final course list approval from university',
    remarks: '',
    date: new Date('2026-09-14'),
    dueDate: new Date('2026-09-28'),
  },
  {
    title: 'Verify Fee Collection Records',
    description: 'Cross-check fee collection records for 2026-27 against bank statements for the first installment.',
    givenBy: 'Accounts Department',
    priority: 'Medium' as const,
    workStatus: 'InProgress' as const,
    reason: 'Some records mismatch — under reconciliation',
    remarks: '',
    date: new Date('2026-09-13'),
    dueDate: new Date('2026-09-18'),
  },
  {
    title: 'Draft Circular for Anti-Ragging Committee',
    description: 'Draft the annual circular for constitution of Anti-Ragging Committee for 2026-27.',
    givenBy: 'Principal',
    priority: 'Medium' as const,
    workStatus: 'Completed' as const,
    reason: '',
    remarks: 'Circular drafted, approved by principal, and uploaded on website on 05-09-2026.',
    date: new Date('2026-09-03'),
    dueDate: new Date('2026-09-05'),
  },
  {
    title: 'Arrange Guest Lecture on AI Trends',
    description: 'Organize a guest lecture by industry expert on current AI/ML trends for final year CS students.',
    givenBy: 'HOD CSE',
    priority: 'Low' as const,
    workStatus: 'Pending' as const,
    reason: 'Speaker confirmation pending',
    remarks: '',
    date: new Date('2026-09-15'),
    dueDate: new Date('2026-10-05'),
  },
  {
    title: 'Process Leave Applications for September',
    description: 'Review and process all pending staff leave applications for the month of September.',
    givenBy: 'HR Manager',
    priority: 'Low' as const,
    workStatus: 'Completed' as const,
    reason: '',
    remarks: 'All 12 leave applications processed and communicated to staff on 08-09-2026.',
    date: new Date('2026-09-08'),
    dueDate: null,
  },
  {
    title: 'Renew Software Licenses',
    description: 'Renew annual licenses for Matlab, MS Office, and antivirus software for the computer labs.',
    givenBy: 'IT Department',
    priority: 'High' as const,
    workStatus: 'Pending' as const,
    reason: 'Procurement approval pending from management',
    remarks: '',
    date: new Date('2026-09-15'),
    dueDate: new Date('2026-09-22'),
  },
  {
    title: 'Prepare Semester-End Faculty Workload Statement',
    description: 'Compile complete teaching workload data for all faculty for the even semester 2025-26.',
    givenBy: 'Dean Academics',
    priority: 'Medium' as const,
    workStatus: 'InProgress' as const,
    reason: 'Data collection from some departments in progress',
    remarks: '',
    date: new Date('2026-09-11'),
    dueDate: new Date('2026-09-20'),
  },
  {
    title: 'Reply to UGC Compliance Notice',
    description: 'Draft and submit a formal reply to the UGC compliance notice received on 10-09-2026.',
    givenBy: 'Principal',
    priority: 'High' as const,
    workStatus: 'InProgress' as const,
    reason: 'Gathering required compliance documents',
    remarks: '',
    date: new Date('2026-09-12'),
    dueDate: new Date('2026-09-17'),
  },
  {
    title: 'Stock Verification of Library Books',
    description: 'Conduct annual stock verification of library books and report discrepancies.',
    givenBy: 'Librarian',
    priority: 'Low' as const,
    workStatus: 'Pending' as const,
    reason: 'Scheduled for last week of September',
    remarks: '',
    date: new Date('2026-09-22'),
    dueDate: new Date('2026-09-30'),
  },
];

async function seed() {
  await connectDB();
  
  const existing = await Task.countDocuments();
  if (existing > 0) {
    console.log(`⚠️  Database already has ${existing} tasks. Skipping seed.`);
    console.log('   To re-seed, drop the collection first.');
    await mongoose.disconnect();
    return;
  }

  console.log(`🌱  Seeding ${SAMPLE_TASKS.length} tasks...`);

  for (const taskData of SAMPLE_TASKS) {
    const taskId = await getNextTaskId();
    const task = new Task({ ...taskData, taskId, userId: null });
    await task.save();
    console.log(`   ✓ ${task.taskId} — ${task.title}`);
  }

  console.log(`\n✅  Seeded ${SAMPLE_TASKS.length} tasks successfully!`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
