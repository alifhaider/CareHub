import { prisma } from '~/db.server'
import bcrypt from 'bcryptjs'
import { faker } from '@faker-js/faker'

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
  const totalSchedules = 60
  // const totalReviews = 40;

  console.time('👨‍⚕️ Creating users...')
  const users = await Promise.all(
    Array.from({ length: totalUsers }).map(async () => {
      const person = faker.internet

      // remove spaces and special characters
      const username = person
        .userName()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
      const user = await prisma.user.create({
        data: {
          email: person.email(),
          username,
          fullName: person.displayName(),
          password: {
            create: {
              hash: await bcrypt.hash('password', 10),
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
          bio: faker.person.bio(),
          userId: users[index].id,
          phone: faker.phone.number(),
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
          image: faker.image.avatar(),
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
      const date = faker.date.soon({ days: 40 })
      date.setUTCHours(0, 0, 0, 0)

      const startTimeHours = Math.floor(Math.random() * 4) + 8 // 8AM - 12PM
      const endTimeHours = Math.floor(Math.random() * 4) + 13 // 1PM - 5PM

      const visitFee = Math.floor(Math.random() * 1000)
      const serialFee = Math.floor(Math.random() * 1000)
      // 10% of the total fee as discount
      const discountFee = Math.floor(Number(visitFee + serialFee) / 10)
      const depositAmount = Math.floor(
        Number(visitFee + serialFee - discountFee) / 10,
      )

      const schedule = await prisma.schedule.create({
        data: {
          doctorId: doctors[Math.floor(Math.random() * totalDoctors)].userId,
          date: date,
          startTime: `${startTimeHours}:${faker.date.anytime().getMinutes()}`,
          endTime: `${endTimeHours}:${faker.date.anytime().getMinutes()}`,
          locationId: scheduleLocations[index % totalScheduleLocations].id,
          maxAppointments: Math.floor(Math.random() * 10),
          serialFee,
          visitFee,
          depositAmount,
          discountFee,
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

  console.time('🌱 Seeding reviews...')
  await Promise.all(
    Array.from({ length: totalAppointments }).map(async (_, index) => {
      const review = await prisma.review.create({
        data: {
          rating: Math.floor(Math.random() * 5),
          comment: faker.lorem.sentence(),
          doctorId: doctors[Math.floor(Math.random() * totalDoctors)].userId,
        },
      })
      return review
    }),
  )
  console.timeEnd('🌱 Seeding reviews...')

  await prisma.user.create({
    data: {
      email: 'alif@haider.dev',
      username: 'alif',
      password: {
        create: {
          hash: await bcrypt.hash('password', 10),
        },
      },
    },
  })

  console.timeEnd('🌱 Seeding database...')
}

seed()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
