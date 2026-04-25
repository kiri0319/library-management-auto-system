# Deployment Checklist

## Before deployment

- [ ] Production environment variables are configured.
- [ ] Database connectivity verified.
- [ ] Seed script run only when required for target environment.
- [ ] CORS origins and socket client URL reviewed.

## Validation

- [ ] Auth flow works for admin/librarian/student.
- [ ] Borrow/return/reservation flows are functional.
- [ ] Report generation endpoints respond correctly.
- [ ] Seat booking and support chat flows are accessible.

## After deployment

- [ ] Monitor logs for startup/runtime errors.
- [ ] Confirm real-time notifications are emitting correctly.
- [ ] Record deployment notes in changelog/release notes.
