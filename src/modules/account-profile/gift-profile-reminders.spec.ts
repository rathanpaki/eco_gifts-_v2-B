import { giftProfileReminder } from './gift-profile-reminders';

describe('gift profile reminders', () => {
  it('creates a stable reminder inside the fourteen-day window', () => {
    const result = giftProfileReminder(
      'profile-1',
      {
        recipientName: 'Maya',
        occasion: 'Birthday',
        importantDate: '2020-09-10',
      },
      null,
      new Date('2026-09-01T12:00:00.000Z'),
    );
    expect(result).toMatchObject({
      category: 'reminders',
      title: "Maya's Birthday is coming up",
      createdAt: '2026-08-27T12:00:00.000Z',
    });
  });

  it('omits profiles outside the reminder window', () => {
    expect(
      giftProfileReminder(
        'profile-1',
        { importantDate: '2020-12-10' },
        null,
        new Date('2026-09-01T12:00:00.000Z'),
      ),
    ).toBeNull();
  });
});
