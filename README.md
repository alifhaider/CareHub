# Note

Thinking of also making a mobile app

To follow,
[Link to Mobile App Repo ➡️](https://github.com/carehuborg/CareHub.git)

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
- [ ] User can book a schedule (With Special Note
- [ ] Make the `/search` route fully functional
- [ ] User can see their booking history

Doctor
- [ ] Dashboard Overview Contain real data
- [ ] Doctor can see upcoming appointment schedule
- [ ] Can apply discount all the schedules
