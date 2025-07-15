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
    // 3. Crea un segundo usuario para pruebas de autorización (Ejercicio 5.22).
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Other User',
        username: 'otheruser',
        password: 'otherpassword'
      }
    })
    // 4. Navega a la página principal de tu aplicación frontend.
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

      // TEST 5.22: Solo el creador puede ver el botón de eliminación.
    test('only the creator can see the delete button', async ({ page }) => {
      const blogTitle = 'Blog by testuser';
      const blogAuthor = 'Test Author';
      const blogUrl = 'http://testuser.blog';
      // 1. Crea un blog con 'testuser' (Ya logueado como 'testuser' por beforeEach).
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
      // 4. Verifica que el botón 'remove' ES visible para el creador ('testuser').
      const removeButton = blogContainer.getByRole('button', { name: 'remove' });
      await expect(removeButton).toBeVisible();
      // 5. Cierra la sesión de 'testuser'.
      await page.getByRole('button', { name: 'logout' }).click();
      await expect(page.getByText('Log in to application')).toBeVisible(); // Confirma que se ha deslogueado
      // 6. Inicia sesión como 'otheruser'.
      await loginWith(page, 'otheruser', 'otherpassword');
      await expect(page.getByText('Other User logged in')).toBeVisible();
      // 7. Haz clic en el botón 'view' del blog creado por 'testuser' (ahora como 'otheruser').
      const blogContainerOtherUser = page.locator('.blogItem', { hasText: `${blogTitle} ${blogAuthor}` });
      await expect(blogContainerOtherUser).toBeVisible();
      await blogContainerOtherUser.getByRole('button', { name: 'view' }).click();
      // 8. Verifica que el botón 'remove' NO ES visible para 'otheruser'.
      const removeButtonOtherUser = blogContainerOtherUser.getByRole('button', { name: 'remove' });
      await expect(removeButtonOtherUser).not.toBeVisible();
      })

      // TEST 5.23: Los blogs están ordenados por likes, el blog con más likes en primer lugar.
      test('blogs are ordered by likes, with the most liked blog first', async ({ page }) => {
        // Usamos el texto visible para verificar que el usuario está logueado
        await expect(page.getByText('Test User logged in')).toBeVisible();
        // 1. Crear varios blogs con diferentes números de likes
        // Blog 1: 5 likes
        await page.getByRole('button', { name: 'create new blog' }).click();
        await page.getByLabel('title:').fill('Blog C - 5 Likes');
        await page.getByLabel('author:').fill('Author C');
        await page.getByLabel('url:').fill('http://blogc.com');
        await page.getByRole('button', { name: 'create' }).click();
        await expect(page.getByText('Blog C - 5 Likes Author C')).toBeVisible();
        const blogCContainer = page.locator('.blogItem', { hasText: 'Blog C - 5 Likes Author C' });
        await blogCContainer.getByRole('button', { name: 'view' }).click();
        for (let i = 0; i <= 5; i++) {
          await blogCContainer.getByRole('button', { name: 'like' }).click();
          await expect(blogCContainer.getByTestId('blog-likes')).toHaveText(i.toString());
        }
        await expect(blogCContainer.getByTestId('blog-likes')).toHaveText('5');
        await blogCContainer.getByRole('button', { name: 'hide' }).click();
        // Blog 2: 10 likes
        await page.getByRole('button', { name: 'create new blog' }).click();
        await page.getByLabel('title:').fill('Blog A - 10 Likes');
        await page.getByLabel('author:').fill('Author A');
        await page.getByLabel('url:').fill('http://bloga.com');
        await page.getByRole('button', { name: 'create' }).click();
        await expect(page.getByText('Blog A - 10 Likes Author A')).toBeVisible();
        const blogAContainer = page.locator('.blogItem', { hasText: 'Blog A - 10 Likes Author A' });
        await blogAContainer.getByRole('button', { name: 'view' }).click();
        for (let i = 0; i <= 10; i++) {
          await blogAContainer.getByRole('button', { name: 'like' }).click();
          await expect(blogAContainer.getByTestId('blog-likes')).toHaveText(i.toString());
        }
        await expect(blogAContainer.getByTestId('blog-likes')).toHaveText('10');
        await blogAContainer.getByRole('button', { name: 'hide' }).click();
        // Blog 3: 2 likes
        await page.getByRole('button', { name: 'create new blog' }).click();
        await page.getByLabel('title:').fill('Blog B - 2 Likes');
        await page.getByLabel('author:').fill('Author B');
        await page.getByLabel('url:').fill('http://blogb.com');
        await page.getByRole('button', { name: 'create' }).click();
        await expect(page.getByText('Blog B - 2 Likes Author B')).toBeVisible();
        const blogBContainer = page.locator('.blogItem', { hasText: 'Blog B - 2 Likes Author B' });
        await blogBContainer.getByRole('button', { name: 'view' }).click();
        for (let i = 0; i <= 2; i++) {
          await blogBContainer.getByRole('button', { name: 'like' }).click();
          await expect(blogBContainer.getByTestId('blog-likes')).toHaveText(i.toString());
        }
        await expect(blogBContainer.getByTestId('blog-likes')).toHaveText('2');
        await blogBContainer.getByRole('button', { name: 'hide' }).click();
        // Volver a cargar la página para asegurar que el orden se actualiza si no es reactivo al 100%
        await page.reload();
      // Usamos el texto visible para verificar que el usuario sigue logueado después de la recarga
        await expect(page.getByText('Test User logged in')).toBeVisible();
        // 2. Obtener los títulos de los blogs en el orden en que aparecen en la página
        // Esperar a que el primer blog esperado sea visible antes de obtener todos los elementos
        // Usamos el selector de clase '.blogItem' para obtener todos los contenedores de blog.
        await expect(page.getByText('Blog A - 10 Likes Author A')).toBeVisible();
        const blogItems = await page.locator('.blogItem').all();
        const displayedTitles = [];
        for (const item of blogItems) {
          // Para cada blog, obtenemos su título usando el data-testid
          const titleElement = await item.getByTestId('blog-title');
          const title = await titleElement.textContent();
          displayedTitles.push(title);
        }
        // 3. Definir el orden esperado (de mayor a menor likes)
        const expectedOrder = [
          'Blog A - 10 Likes',
          'Blog C - 5 Likes',
          'Blog B - 2 Likes'
        ];
        // 4. Afirmar que el orden de los blogs mostrados coincide con el orden esperado
        expect(displayedTitles).toEqual(expectedOrder);
      });
    })

})