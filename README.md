# Note

Thinking of also making a mobile app

To follow,
[Link to Mobile App Repo ➡️](https://github.com/carehuborg/CareHub.git)

And I stopped contributing to it. I'll finish this first

# CareHub

An app for people who are sick and want to book an appoinment with a doctor. It
helps people to find better doctors.

## Development

First install all the dependencies with

```
npm install
```

Then add `.env` file to the project. For local development from `.env.example`
remove `.example` and keep it as `.env` will do the job

Then run to seed and configure database

```
npm run setup
```

And then start the app with

```
npm run dev
```

### Todos

User

- [ ] User can reset password
- [x] book a schedule (With Special Note) without payment
- [ ] Implement Payment gateway
- [ ] Make the `/search` route fully functional
- [ ] Infinite scroll on `/search` route
- [ ] Search by name
- [ ] Search by location
- [ ] Search by date range
- [ ] Add filters for Doctor Specialty
- [ ] Price Range
- [ ] Display doctor name and price in map
- [x] User can see their booking history
- [x] Cancel a booking (at least before 6hrs)
- [ ] integrate google map, with doctor location marks
- [x] submit a review
- [ ] get an invoice for booking (after payment)
- [ ] email service for a successful booking
- [ ] email service before a booking date, before 2 hours (if the booking is
      more than 2 days after)

Doctor

- [x] Fix edit schedule
- [ ] Dashboard Overview Contain real data
- [ ] Doctor can see upcoming appointment schedule
- [ ] Can apply discount all the schedules
- [ ] add balance and currency type
- [ ] add social accounts
- [x] schedule location with lat and long (for better position at map)
- [ ] Display balance and request to get paid

Admin

- [ ] Dashboard to see how many bookings made everyday, week, month and year
- [ ] List to see which doctors asked to get paid
- [ ] How much of balance a doctor have
- [ ] Make the payment for doctors (Maybe automatic)
