import { test, expect } from '@playwright/test';


test.describe('Chat room', () => {
  test('should allow to send messages between two chats', async ({ page: user_01, context }) => {
    await joinRoom('user01', 'test-room-1', user_01);

    const user_02 = await context.newPage();
    const user_03 = await context.newPage();

    await joinRoom('user02', 'test-room-1', user_02);
    await joinRoom('user03', 'test-room-2', user_03);

    await sendChatMessage(user_01, 'Message from user 01');

    await assertChatMessage(user_01, 'user01: Message from user 01', 1);
    await assertChatMessage(user_02, 'user01: Message from user 01', 1);

    await sendChatMessage(user_02, 'User 02 message');

    await assertChatMessage(user_01, 'user02: User 02 message', 2);
    await assertChatMessage(user_02, 'user02: User 02 message', 2);

    await expect(user_03.locator("[data-testid=chat-message]")).toBeHidden();

  });
});

const assertChatMessage = async (page, message, index) => {
  await expect(page.locator(`[data-testid=chat-message]:nth-child(${index})`)).toHaveText(message)
}

const joinRoom = async (username, roomId, page) => {
  await page.goto('/');

  await page.getByPlaceholder('username').fill(username);
  await page.getByPlaceholder('room id').fill(roomId);
  await page.locator("[type=submit]").click();
}

const sendChatMessage = async (page, message) => {
  await page.getByPlaceholder('chatMessage').fill(message);
  await page.getByPlaceholder('chatMessage').press('Enter');
}
