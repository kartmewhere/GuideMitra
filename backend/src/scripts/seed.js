const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Seed colleges
  console.log('📚 Seeding colleges...');
  const colleges = [
    {
      name: 'Indian Institute of Technology Delhi',
      type: 'GOVERNMENT',
      location: 'Hauz Khas, New Delhi',
      state: 'Delhi',
      city: 'New Delhi',
      website: 'https://home.iitd.ac.in',
      phone: '+91-11-2659-1000',
      facilities: ['Library', 'Hostel', 'Sports Complex', 'Research Labs', 'Cafeteria'],
      programs: ['Computer Science Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering'],
      rating: 4.8,
      established: 1961
    },
    {
      name: 'All India Institute of Medical Sciences Delhi',
      type: 'GOVERNMENT',
      location: 'Ansari Nagar, New Delhi',
      state: 'Delhi',
      city: 'New Delhi',
      website: 'https://www.aiims.edu',
      phone: '+91-11-2659-3333',
      facilities: ['Hospital', 'Library', 'Hostel', 'Research Centers', 'Cafeteria'],
      programs: ['MBBS', 'BDS', 'B.Sc Nursing', 'Paramedical Courses'],
      rating: 4.9,
      established: 1956
    },
    {
      name: 'Indian Institute of Management Ahmedabad',
      type: 'AUTONOMOUS',
      location: 'Vastrapur, Ahmedabad',
      state: 'Gujarat',
      city: 'Ahmedabad',
      website: 'https://www.iima.ac.in',
      phone: '+91-79-6632-4000',
      facilities: ['Library', 'Hostel', 'Sports Complex', 'Conference Halls', 'Cafeteria'],
      programs: ['MBA', 'Executive MBA', 'Fellow Programme in Management'],
      rating: 4.7,
      established: 1961
    },
    {
      name: 'Birla Institute of Technology and Science Pilani',
      type: 'DEEMED',
      location: 'Pilani, Rajasthan',
      state: 'Rajasthan',
      city: 'Pilani',
      website: 'https://www.bits-pilani.ac.in',
      phone: '+91-1596-242-531',
      facilities: ['Library', 'Hostel', 'Sports Complex', 'Labs', 'Cafeteria'],
      programs: ['Computer Science Engineering', 'Electronics Engineering', 'Mechanical Engineering', 'Chemical Engineering'],
      rating: 4.6,
      established: 1964
    },
    {
      name: 'National Institute of Technology Trichy',
      type: 'GOVERNMENT',
      location: 'Tiruchirappalli, Tamil Nadu',
      state: 'Tamil Nadu',
      city: 'Tiruchirappalli',
      website: 'https://www.nitt.edu',
      phone: '+91-431-250-3000',
      facilities: ['Library', 'Hostel', 'Sports Complex', 'Research Labs', 'Cafeteria'],
      programs: ['Computer Science Engineering', 'Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering'],
      rating: 4.5,
      established: 1964
    }
  ];

  for (const college of colleges) {
    await prisma.college.upsert({
      where: { name: college.name },
      update: {},
      create: college
    });
  }

  // Seed courses
  console.log('📖 Seeding courses...');
  const courses = [
    {
      name: 'Computer Science Engineering',
      code: 'CSE',
      level: 'UNDERGRADUATE',
      field: 'Engineering',
      description: 'Study of algorithms, programming languages, and computer systems',
      duration: '4 years',
      careerPaths: ['Software Engineer', 'Data Scientist', 'Product Manager', 'Tech Entrepreneur'],
      skills: ['Programming', 'Data Structures', 'Algorithms', 'System Design'],
      prerequisites: ['Mathematics', 'Physics', 'Chemistry'],
      eligibility: '10+2 with PCM, JEE Main/Advanced'
    },
    {
      name: 'MBBS',
      code: 'MBBS',
      level: 'UNDERGRADUATE',
      field: 'Medical',
      description: 'Bachelor of Medicine and Bachelor of Surgery',
      duration: '5.5 years',
      careerPaths: ['General Physician', 'Specialist Doctor', 'Surgeon', 'Medical Researcher'],
      skills: ['Medical Knowledge', 'Patient Care', 'Communication', 'Empathy'],
      prerequisites: ['Biology', 'Chemistry', 'Physics'],
      eligibility: '10+2 with PCB, NEET UG'
    },
    {
      name: 'Mechanical Engineering',
      code: 'ME',
      level: 'UNDERGRADUATE',
      field: 'Engineering',
      description: 'Design, analysis, and manufacturing of mechanical systems',
      duration: '4 years',
      careerPaths: ['Mechanical Engineer', 'Automotive Engineer', 'Manufacturing Engineer'],
      skills: ['CAD/CAM', 'Thermodynamics', 'Manufacturing', 'Problem Solving'],
      prerequisites: ['Mathematics', 'Physics', 'Chemistry'],
      eligibility: '10+2 with PCM, JEE Main/Advanced'
    },
    {
      name: 'Business Administration',
      code: 'BBA',
      level: 'UNDERGRADUATE',
      field: 'Management',
      description: 'Study of business operations and management principles',
      duration: '3 years',
      careerPaths: ['Business Analyst', 'Marketing Manager', 'Consultant', 'Entrepreneur'],
      skills: ['Leadership', 'Finance', 'Marketing', 'Strategy'],
      prerequisites: ['Any stream in 10+2'],
      eligibility: '10+2 from any stream'
    }
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { name: course.name },
      update: {},
      create: course
    });
  }

  // Seed global timeline events
  console.log('📅 Seeding timeline events...');
  const currentYear = new Date().getFullYear();
  const timelineEvents = [
    {
      title: 'JEE Main 2024 Registration',
      description: 'Registration for Joint Entrance Examination Main',
      type: 'EXAM',
      eventDate: new Date(`${currentYear + 1}-01-15`),
      reminderDate: new Date(`${currentYear + 1}-01-01`),
      isGlobal: true,
      metadata: {
        examType: 'Engineering Entrance',
        website: 'https://jeemain.nta.nic.in',
        eligibility: '10+2 with PCM'
      }
    },
    {
      title: 'NEET UG 2024 Registration',
      description: 'Registration for National Eligibility cum Entrance Test',
      type: 'EXAM',
      eventDate: new Date(`${currentYear + 1}-02-01`),
      reminderDate: new Date(`${currentYear + 1}-01-15`),
      isGlobal: true,
      metadata: {
        examType: 'Medical Entrance',
        website: 'https://neet.nta.nic.in',
        eligibility: '10+2 with PCB'
      }
    },
    {
      title: 'CAT 2024 Registration',
      description: 'Registration for Common Admission Test for MBA',
      type: 'EXAM',
      eventDate: new Date(`${currentYear + 1}-08-01`),
      reminderDate: new Date(`${currentYear + 1}-07-15`),
      isGlobal: true,
      metadata: {
        examType: 'Management Entrance',
        website: 'https://iimcat.ac.in',
        eligibility: 'Bachelor\'s degree'
      }
    },
    {
      title: 'CBSE Class 12 Board Exams',
      description: 'Central Board of Secondary Education Class 12 examinations',
      type: 'EXAM',
      eventDate: new Date(`${currentYear + 1}-03-01`),
      reminderDate: new Date(`${currentYear + 1}-02-15`),
      isGlobal: true,
      metadata: {
        examType: 'Board Exam',
        website: 'https://cbse.gov.in'
      }
    },
    {
      title: 'National Scholarship Portal Registration',
      description: 'Registration for various government scholarships',
      type: 'SCHOLARSHIP',
      eventDate: new Date(`${currentYear + 1}-07-01`),
      reminderDate: new Date(`${currentYear + 1}-06-15`),
      isGlobal: true,
      metadata: {
        website: 'https://scholarships.gov.in',
        eligibility: 'Various criteria based on scholarship type'
      }
    }
  ];

  for (const event of timelineEvents) {
    await prisma.timelineEvent.upsert({
      where: { 
        id: event.title.replace(/\s+/g, '-').toLowerCase() + '-' + currentYear
      },
      update: {},
      create: {
        ...event,
        id: event.title.replace(/\s+/g, '-').toLowerCase() + '-' + currentYear
      }
    });
  }

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });