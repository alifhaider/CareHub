import { prisma } from '~/db.server'
import bcrypt from 'bcryptjs'

const mock_specialties = [
  'Cardiologist',
  'Dermatologist',
  'Endocrinologist',
  'Gastroenterologist',
  'Hematologist',
  'Nephrologist',
  'Neurologist',
  'Oncologist',
  'Ophthalmologist',
  'Otolaryngologist',
  'Pediatrician',
  'Physiatrist',
  'Psychiatrist',
  'Pulmonologist',
  'Radiologist',
  'Rheumatologist',
  'Urologist',
]

const institutes = [
  {
    degree: 'MBBS',
    institute: 'Dhaka Medical College',
    year: '2010',
  },
  {
    degree: 'MD',
    institute: 'National Institute of Cardiovascular Diseases',
    year: '2015',
  },
  {
    degree: 'FCPS',
    institute: 'Bangabandhu Sheikh Mujib Medical University',
    year: '2017',
  },
  {
    degree: 'MRCP',
    institute: 'Royal College of Physicians',
    year: '2019',
  },
  {
    degree: 'FRCP',
    institute: 'Royal College of Physicians',
    year: '2021',
  },
]

const locations = [
  {
    name: 'Square Hospital',
    address: '18/F West Panthapath, Dhaka 1205',
    city: 'Dhaka',
    state: 'Dhaka',
    zip: '1205',
  },
  {
    name: 'Apollo Hospital',
    address: 'Plot: 81, Block: E, Bashundhara R/A, Dhaka 1229',
    city: 'Dhaka',
    state: 'Dhaka',
    zip: '1229',
  },
  {
    name: 'United Hospital',
    address: 'Plot 15, Road 71, Gulshan, Dhaka 1212',
    city: 'Dhaka',
    state: 'Dhaka',
    zip: '1212',
  },
  {
    name: 'Labaid Hospital',
    address: 'House- 01, Road- 04, Dhanmondi, Dhaka 1205',
    city: 'Dhaka',
    state: 'Dhaka',
    zip: '1205',
  },
  {
    name: 'Ibn Sina Hospital',
    address: 'House 48, Road 9/A, Dhanmondi, Dhaka 1209',
    city: 'Dhaka',
    state: 'Dhaka',
    zip: '1209',
  },
]

async function seed() {
  console.log('Seeding database...')
  console.time('🌱 Seeding database...')

  console.time('🧹 Clean up database...')
  await prisma.booking.deleteMany()
  await prisma.fee.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.doctorSpecialty.deleteMany()
  await prisma.scheduleLocation.deleteMany()
  await prisma.education.deleteMany()
  await prisma.review.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.user.deleteMany()
  await prisma.password.deleteMany()


  console.timeEnd('🧹 Clean up database...')

  const totalUsers = 40
  const totalDoctors = 20
  const totalAppointments = 20
  const totalScheduleLocations = 10
  const totalSchedules = 10
  // const totalReviews = 40;

  console.time('👨‍⚕️ Creating users...')
  const users = await Promise.all(
    Array.from({ length: totalUsers }).map(async (_, index) => {
      const user = await prisma.user.create({
        data: {
          email: `user${index}@gmail.com`,
          username: `user${index}`,
          password: {
            create: {
              hash: bcrypt.hashSync(`user-${index}`, 10),
            },
          },
        },
      })
      return user
    }),
  )
  console.timeEnd('👨‍⚕️ Creating users...')

  console.time('👨‍⚕️ Creating doctors...')
  const doctors = await Promise.all(
    Array.from({ length: totalDoctors }).map(async (_, index) => {
      const doctor = await prisma.doctor.create({
        data: {
          bio: `Doctor's bio ${index}`,
          userId: users[index].id,
          fullName: `Dr. User ${index}`,
          phone: `+8801${Math.floor(Math.random() * 1000000000)}`,
          specialties: {
            createMany: {
              data: Array.from({
                length: Math.floor(Math.random() * 3) + 1,
              }).map(() => ({
                name: mock_specialties[
                  Math.floor(Math.random() * mock_specialties.length)
                ],
              })),
            },
          },
          rating: Math.floor(Math.random() * 5),
          education: {
            createMany: {
              data: Array.from({
                length: Math.floor(Math.random() * 3) + 1,
              }).map(() => ({
                degree:
                  institutes[Math.floor(Math.random() * institutes.length)]
                    .degree,
                institute:
                  institutes[Math.floor(Math.random() * institutes.length)]
                    .institute,
                year: institutes[Math.floor(Math.random() * institutes.length)]
                  .year,
              })),
            },
          },
        },
      })
      return doctor
    }),
  )
  console.timeEnd('👨‍⚕️ Creating doctors...')

  console.time('👨‍⚕️ Creating scheduleLocations...')
  const scheduleLocations = await Promise.all(
    Array.from({ length: totalScheduleLocations }).map(async (_, index) => {
      const scheduleLocation = await prisma.scheduleLocation.create({
        data: {
          name: locations[index % locations.length].name,
          address: locations[index % locations.length].address,
          city: locations[index % locations.length].city,
          state: locations[index % locations.length].state,
          zip: locations[index % locations.length].zip,
        },
      })
      return scheduleLocation
    }),
  )
  console.timeEnd('👨‍⚕️ Creating scheduleLocations...')

  console.time('👨‍⚕️ Creating schedules...')
  const schedules = await Promise.all(
    Array.from({ length: totalSchedules }).map(async (_, index) => {
      const schedule = await prisma.schedule.create({
        data: {
          doctorId: doctors[Math.floor(Math.random() * totalDoctors)].userId,
          day: getDay(Math.floor(Math.random() * 7)),
          startTime: new Date(new Date().setHours(Math.random() + 9, 0, 0, 0)),
          endTime: new Date(new Date().setHours(Math.random() + 17, 0, 0, 0)),
          locationId: scheduleLocations[index % totalScheduleLocations].id,
          maxAppointments: Math.floor(Math.random() * 10),
          fees: {
            create: {
              serial: Math.floor(Math.random() * 100),
              visit: Math.floor(Math.random() * 1000),
              discount: Math.floor(Math.random() * 100),
            }
          }
        },
      })
      return schedule
    }),
  )
  console.timeEnd('👨‍⚕️ Creating schedules...')

  console.time('👨‍⚕️ Creating bookings...')
  await Promise.all(
    Array.from({ length: totalAppointments }).map(async (_, index) => {
      const appointment = await prisma.booking.create({
        data: {
          date: schedules[Math.floor(Math.random() * totalSchedules)].startTime,
          status: 'PENDING',
          scheduleId: schedules[index % totalSchedules].id,
          userId: users[index % totalUsers].id,
          doctorId: doctors[Math.floor(Math.random() * totalDoctors)].userId,
        },
      })
      return appointment
    }),
  )
  console.timeEnd('👨‍⚕️ Creating bookings...')

  console.timeEnd('🌱 Seeding database...')
}

function getDay(day: number) {
  switch (day) {
    case 0:
      return 'SUNDAY'
    case 1:
      return 'MONDAY'
    case 2:
      return 'TUESDAY'
    case 3:
      return 'WEDNESDAY'
    case 4:
      return 'THURSDAY'
    case 5:
      return 'FRIDAY'
    case 6:
      return 'SATURDAY'
    default:
      return 'MONDAY'
  }
}

seed()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
