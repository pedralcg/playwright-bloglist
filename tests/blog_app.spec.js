const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith } = require('./helper')


describe('Blog app', () => {
  // Este beforeEach se ejecutará antes de CADA test en este 'describe' principal.
  // Incluye la limpieza de la DB y la creación de un usuario de prueba.
  beforeEach(async ({ page, request }) => {
    // 1. Vacía la base de datos del backend antes de cada test.
    await request.post('/api/testing/reset')
    // 2. Crea un usuario por defecto en el backend para las pruebas.
    await request.post('/api/users', {
      data: {
        name: 'Test User',
        username: 'testuser',
        password: 'testpassword'
      }
    })
    // 3. Navega a la página principal de tu aplicación frontend.
    // 'baseURL' configurada en playwright.config.js (ej. 'http://localhost:5173').
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

    // Bloque 'describe' para las pruebas de inicio de sesión.
    describe('Login', () => {
      // Test 5.18a: Verificar que el inicio de sesión es exitoso con credenciales correctas.
      test('succeeds with correct credentials', async ({ page }) => {
      // Busca el elemento con la clase 'success' (de tu Notification component) y verifica que contenga el texto esperado.
      await loginWith(page, 'testuser', 'testpassword')
      // Espera que el mensaje persistente de "logged in" del usuario sea visible.
      await expect(page.getByText('Test User logged in')).toBeVisible()
      // Espera que el formulario de inicio de sesión YA NO sea visible.
      await expect(page.getByText('Log in to application')).not.toBeVisible()
      })

      // Test 5.18b: Verificar que el inicio de sesión falla con credenciales incorrectas.
      test('fails with wrong credentials', async ({ page }) => {
      // Intenta iniciar sesión con una contraseña incorrecta.
      await loginWith(page, 'testuser', 'wrongpassword')
      // Espera que el mensaje de error sea visible.
      await expect(page.locator('.error')).toContainText('Wrong credentials')
      // Espera que el mensaje de "logged in" NO sea visible.
      await expect(page.getByText('Welcome, Test User!')).not.toBeVisible()
      //? Opcional: Si el formulario de login permanece visible o el botón de login sigue ahí, puedes verificarlo.
      await expect(page.getByRole('button', { name: 'login' })).toBeVisible()
      })
    })

    // Bloque 'describe' para tests que requieren que el usuario esté logueado.
    describe('when logged in', () => {
      // Asegura que el usuario siempre esté logueado al inicio de cada test aquí.
      beforeEach(async ({ page }) => {
        await loginWith(page, 'testuser', 'testpassword')
        await expect(page.getByText('Test User logged in')).toBeVisible()
      })

      // Test 5.19: Verificar que un nuevo blog puede ser creado.
      test('a new blog can be created', async ({ page }) => {
        // 1. Haz clic en el botón para mostrar el formulario de creación de blog.
        await page.getByRole('button', { name: 'create new blog' }).click()
        // 2. Rellena los campos del formulario de creación de blog.
        await page.getByLabel('title:').fill('A blog created by Playwright')
        await page.getByLabel('author:').fill('Playwright Author')
        await page.getByLabel('url:').fill('http://playwright.dev/blog')
        // 3. Haz clic en el botón para guardar/crear el blog.
        await page.getByRole('button', { name: 'create' }).click()
        // 4. Verifica que el título y autor del blog recién creado son visibles en la lista de blogs.
        await expect(page.getByText('A blog created by Playwright Playwright Author')).toBeVisible()
      })

      // Test 5.20: Verificar que un blog puede ser editado (ej. dar like).
      test('a blog can be liked', async ({ page }) => {
        // 1. Crea un nuevo blog para tener algo que editar.
        await page.getByRole('button', { name: 'create new blog' }).click()
        await page.getByLabel('title:').fill('Blog to be liked')
        await page.getByLabel('author:').fill('Like Tester')
        await page.getByLabel('url:').fill('http://test.com/like-blog')
        await page.getByRole('button', { name: 'create' }).click()
        // 2. Verifica que el blog aparece en la lista y obtiene su contenedor principal.
        const blogContainer = page.locator('.blogItem', { hasText: 'Blog to be liked Like Tester' });
        await expect(blogContainer).toBeVisible(); // Asegura que el contenedor completo del blog es visible
        // 3. Haz clic en el botón 'view' para mostrar los detalles del blog (incluyendo el botón 'like').
        await blogContainer.getByRole('button', { name: 'view' }).click()
        // 4. Verifica que el número inicial de likes es 0 (o el valor por defecto de tu backend).
        const initialLikesElement = blogContainer.getByTestId('blog-likes')
        await expect(initialLikesElement).toHaveText('0') // Asume que empieza en 0 likes
        // 5. Haz clic en el botón 'like'.
        await blogContainer.getByRole('button', { name: 'like' }).click()
        // 6. Verifica que el número de likes ha aumentado.
        await expect(initialLikesElement).toHaveText('1') // Ahora debería ser 1 like
      })

      // TEST 5.21: Verificar que el usuario que creó un blog puede eliminarlo.
      test('the user who created a blog can delete it', async ({ page }) => {
        const blogTitle = 'Blog to be deleted';
        const blogAuthor = 'Deleter User';
        const blogUrl = 'http://delete.me';
        // 1. Crea un nuevo blog con el usuario logueado.
        await page.getByRole('button', { name: 'create new blog' }).click();
        await page.getByLabel('title:').fill(blogTitle);
        await page.getByLabel('author:').fill(blogAuthor);
        await page.getByLabel('url:').fill(blogUrl);
        await page.getByRole('button', { name: 'create' }).click();
        // 2. Verifica que el blog aparece en la lista.
        const blogContainer = page.locator('.blogItem', { hasText: `${blogTitle} ${blogAuthor}` });
        await expect(blogContainer).toBeVisible();
        // 3. Haz clic en el botón 'view' para mostrar los detalles del blog.
        await blogContainer.getByRole('button', { name: 'view' }).click();
        // 4. Configura el manejador del diálogo 'confirm'.
        page.on('dialog', async dialog => {
          expect(dialog.type()).toContain('confirm'); // Opcional: verifica que es un diálogo de confirmación
          expect(dialog.message()).toContain(`Remove blog "${blogTitle}" by ${blogAuthor}?`); // Opcional: verifica el mensaje
          await dialog.accept(); // Acepta el diálogo (simula hacer clic en 'OK')
        });
        // 5. Haz clic en el botón 'remove'.
        await blogContainer.getByRole('button', { name: 'remove' }).click();
        // 6. Verifica que el blog ya no es visible en la lista.
        await expect(blogContainer).not.toBeVisible();
        // Verifica que el texto del blog ya no está en la página.
        await expect(page.getByText(`${blogTitle} ${blogAuthor}`)).not.toBeVisible();
      })
    })

})