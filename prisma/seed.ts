import { prisma } from "~/db.server";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");
  console.time("🌱 Seeding database...");

  console.time("🧹 Clean up database...");
  await prisma.booking.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.scheduleLocation.deleteMany();
  await prisma.education.deleteMany();
  await prisma.review.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.password.deleteMany();
  console.timeEnd("🧹 Clean up database...");

  const totalUsers = 10;
  const totalDoctors = 5;
  const totalAppointments = 20;
  const totalScheduleLocations = 10;
  const totalSchedules = 10;
  const totalReviews = 40;

  console.time("👨‍⚕️ Creating users...");
  const users = await Promise.all(
    Array.from({ length: totalUsers }).map(async (_, index) => {
      const user = await prisma.user.create({
        data: {
          email: `user${index}@email.com`,
          username: `user${index}`,
          password: {
            create: {
              hash: bcrypt.hashSync(`user${index}`, 10),
            },
          },
        },
      });
      return user;
    })
  );
  console.timeEnd("👨‍⚕️ Creating users...");

  console.time("👨‍⚕️ Creating doctors...");
  const doctors = await Promise.all(
    Array.from({ length: totalDoctors }).map(async (_, index) => {
      const doctor = await prisma.doctor.create({
        data: {
          bio: `I am doctor. I have bio for ${index}th-doctor`,
          userId: users[index % totalUsers].id,
          specialty: `speciality-${index}`,
          education: {
            create: {
              degree: `degree-${index}`,
              institute: `institute-${index}`,
              year: (Math.random() * 10 + 2010).toString(),
            },
          },
        },
      });
      return doctor;
    })
  );
  console.timeEnd("👨‍⚕️ Creating doctors...");

  console.time("👨‍⚕️ Creating scheduleLocations...");
  const scheduleLocations = await Promise.all(
    Array.from({ length: totalScheduleLocations }).map(async (_, index) => {
      const scheduleLocation = await prisma.scheduleLocation.create({
        data: {
          name: `location-name-${index}`,
          address: `address-name-${index}`,
          city: `city-name-${index}`,
        },
      });
      return scheduleLocation;
    })
  );
  console.timeEnd("👨‍⚕️ Creating scheduleLocations...");

  console.time("👨‍⚕️ Creating schedules...");
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
        },
      });
      return schedule;
    })
  );
  console.timeEnd("👨‍⚕️ Creating schedules...");

  console.time("👨‍⚕️ Creating bookings...");
  await Promise.all(
    Array.from({ length: totalAppointments }).map(async (_, index) => {
      const appointment = await prisma.booking.create({
        data: {
          date: schedules[Math.floor(Math.random() * totalSchedules)].startTime,
          status: "PENDING",
          scheduleId: schedules[index % totalSchedules].id,
          userId: users[index % totalUsers].id,
          doctorId: doctors[Math.floor(Math.random() * totalDoctors)].userId,
        },
      });
      return appointment;
    })
  );
  console.timeEnd("👨‍⚕️ Creating bookings...");

  console.timeEnd("🌱 Seeding database...");
}

function getDay(day: number) {
  switch (day) {
    case 0:
      return "SUNDAY";
    case 1:
      return "MONDAY";
    case 2:
      return "TUESDAY";
    case 3:
      return "WEDNESDAY";
    case 4:
      return "THURSDAY";
    case 5:
      return "FRIDAY";
    case 6:
      return "SATURDAY";
    default:
      return "MONDAY";
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
