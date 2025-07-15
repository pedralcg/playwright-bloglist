const { test, expect, beforeEach, describe } = require('@playwright/test')

describe('Blog app', () => {
  // Antes de cada test en este bloque 'describe', navega a la URL base de tu aplicación frontend.
  // 'baseURL' configurada en playwright.config.js
  beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  // Test 5.17: Verificar que el formulario de inicio de sesión se muestra por defecto.
  test('Login form is shown', async ({ page }) => {
    // Espera que el título principal del formulario de inicio de sesión sea visible.
    await expect(page.getByText('Log in to application')).toBeVisible()
    // Espera que el campo de entrada del nombre de usuario sea visible.
    await expect(page.getByTestId('username-input')).toBeVisible()
    // Espera que el campo de entrada de la contraseña sea visible.
    await expect(page.getByTestId('password-input')).toBeVisible()
    // Espera que el botón de inicio de sesión sea visible.
    await expect(page.getByRole('button', { name: 'login' })).toBeVisible()
  })
})
