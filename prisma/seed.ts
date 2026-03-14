import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

type UserDef = {
  name: string;
  role: string | null;
  isScrumMaster: boolean;
};

const users: UserDef[] = [
  // Pure DEV (5)
  { name: "dev-1", role: "DEV", isScrumMaster: false },
  { name: "dev-2", role: "DEV", isScrumMaster: false },
  { name: "dev-3", role: "DEV", isScrumMaster: false },
  { name: "dev-4", role: "DEV", isScrumMaster: false },
  { name: "dev-5", role: "DEV", isScrumMaster: false },
  // Pure QA (5)
  { name: "qa-1", role: "QA", isScrumMaster: false },
  { name: "qa-2", role: "QA", isScrumMaster: false },
  { name: "qa-3", role: "QA", isScrumMaster: false },
  { name: "qa-4", role: "QA", isScrumMaster: false },
  { name: "qa-5", role: "QA", isScrumMaster: false },
  // DEV + Scrum Master (2)
  { name: "dev-sm-1", role: "DEV", isScrumMaster: true },
  { name: "dev-sm-2", role: "DEV", isScrumMaster: true },
  // QA + Scrum Master (2)
  { name: "qa-sm-1", role: "QA", isScrumMaster: true },
  { name: "qa-sm-2", role: "QA", isScrumMaster: true },
  // Pure Scrum Master (2)
  { name: "sm-1", role: null, isScrumMaster: true },
  { name: "sm-2", role: null, isScrumMaster: true },
];

type TicketDef = {
  externalId: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
};

const tickets: TicketDef[] = [
  // Auth (4)
  {
    externalId: "TODO-1",
    title: "Регистрация по email/password",
    description:
      "Форма регистрации с полями email, password, confirm password. Валидация на клиенте и сервере. Хеширование пароля через bcrypt. Отправка confirmation email.",
    acceptanceCriteria: [
      "Форма содержит поля: email, password, confirm password",
      "Валидация email формата на клиенте",
      "Пароль минимум 8 символов, 1 заглавная, 1 цифра",
      "При несовпадении паролей — inline ошибка",
      "После успешной регистрации — редирект на /login",
      "Дубликат email — серверная ошибка 'Email уже зарегистрирован'",
    ].join("\n"),
  },
  {
    externalId: "TODO-2",
    title: "Логин / Логаут",
    description:
      "Страница входа с email/password. JWT access + refresh токены. Логаут с инвалидацией refresh токена. Persistent session через httpOnly cookie.",
    acceptanceCriteria: [
      "Форма логина: email + password",
      "При неверных данных — 'Неверный email или пароль'",
      "После успешного логина — редирект на главную",
      "Кнопка логаута в хедере",
      "После логаута — редирект на /login",
      "Refresh token продлевает сессию автоматически",
    ].join("\n"),
  },
  {
    externalId: "TODO-3",
    title: "Сброс пароля через email",
    description:
      "Форма 'Забыли пароль' отправляет ссылку на email. Ссылка ведёт на страницу ввода нового пароля. Токен одноразовый, истекает через 1 час.",
    acceptanceCriteria: [
      "Страница /forgot-password с полем email",
      "Письмо с reset-ссылкой приходит в течение 1 минуты",
      "Ссылка содержит одноразовый токен",
      "Токен истекает через 1 час",
      "Страница /reset-password: новый пароль + подтверждение",
      "После успешного сброса — редирект на /login",
    ].join("\n"),
  },
  {
    externalId: "TODO-4",
    title: "OAuth 2.0 (Google)",
    description:
      "Кнопка 'Войти через Google' на страницах логина и регистрации. OAuth 2.0 flow с Google. Автоматическое создание аккаунта при первом входе. Линковка с существующим аккаунтом по email.",
    acceptanceCriteria: [
      "Кнопка 'Sign in with Google' на /login и /register",
      "OAuth flow: redirect → Google consent → callback",
      "Первый вход — автосоздание аккаунта",
      "Если email уже зарегистрирован — линковка аккаунтов",
      "Аватар из Google профиля сохраняется",
      "Работает на мобильных браузерах",
    ].join("\n"),
  },

  // Core CRUD (5)
  {
    externalId: "TODO-5",
    title: "Создание / редактирование / удаление задач",
    description:
      "Базовый CRUD для todo-элементов. Инлайн-создание через input в конце списка. Редактирование по клику на текст. Удаление через иконку корзины с confirm-диалогом.",
    acceptanceCriteria: [
      "Input для новой задачи внизу списка, Enter для создания",
      "Клик на текст задачи — переход в режим редактирования",
      "Escape или клик вне — отмена редактирования",
      "Иконка корзины появляется при hover",
      "Confirm-диалог перед удалением",
      "Пустая задача не создаётся (валидация)",
    ].join("\n"),
  },
  {
    externalId: "TODO-6",
    title: "Статусы задач (pending / in-progress / done)",
    description:
      "Три состояния задачи: pending (новая), in-progress (в работе), done (завершена). Чекбокс для быстрого завершения. Визуальная индикация статуса цветом и иконкой.",
    acceptanceCriteria: [
      "Новая задача создаётся со статусом 'pending'",
      "Чекбокс слева от задачи для toggle pending ↔ done",
      "Завершённые задачи — зачёркнутый текст, серый цвет",
      "Dropdown для смены статуса: pending / in-progress / done",
      "In-progress — жёлтый индикатор",
      "Счётчик задач по статусам в хедере списка",
    ].join("\n"),
  },
  {
    externalId: "TODO-7",
    title: "Дедлайны и напоминания",
    description:
      "Date picker для установки дедлайна. Цветовая индикация: зелёный (>3 дня), жёлтый (1-3 дня), красный (просрочено). Push-уведомления за 1 день и в момент дедлайна.",
    acceptanceCriteria: [
      "Date picker при клике на иконку календаря",
      "Дата отображается рядом с задачей",
      "Зелёный бейдж — до дедлайна > 3 дней",
      "Жёлтый бейдж — 1–3 дня до дедлайна",
      "Красный бейдж — просрочено",
      "Browser push-уведомление за 24 часа",
      "Уведомление в момент наступления дедлайна",
    ].join("\n"),
  },
  {
    externalId: "TODO-8",
    title: "Приоритеты (low / medium / high / urgent)",
    description:
      "Четыре уровня приоритета с цветовой маркировкой. Сортировка списка по приоритету. Фильтр по приоритету в тулбаре.",
    acceptanceCriteria: [
      "Выбор приоритета при создании и редактировании задачи",
      "Low — серый флаг, Medium — синий, High — оранжевый, Urgent — красный",
      "По умолчанию — Medium",
      "Кнопка сортировки по приоритету (desc)",
      "Фильтр по одному или нескольким приоритетам",
      "Приоритет виден в карточке задачи",
    ].join("\n"),
  },
  {
    externalId: "TODO-9",
    title: "Массовые действия",
    description:
      "Мульти-выбор задач чекбоксами. Toolbar массовых действий: отметить все завершёнными, удалить выбранные, сменить приоритет. Кнопка 'Очистить завершённые'.",
    acceptanceCriteria: [
      "Чекбокс 'Select all' в хедере списка",
      "Индивидуальные чекбоксы слева от задач",
      "Toolbar появляется при выборе ≥1 задачи",
      "Действия: Mark as Done, Delete, Change Priority",
      "Кнопка 'Clear completed' — удаляет все done-задачи",
      "Confirm-диалог перед массовым удалением",
      "Счётчик выбранных задач в toolbar",
    ].join("\n"),
  },

  // Lists & Organization (4)
  {
    externalId: "TODO-10",
    title: "Множественные списки / доски",
    description:
      "Пользователь может создавать несколько списков (например: 'Работа', 'Личное', 'Покупки'). Sidebar с навигацией между списками. Каждый список — отдельная коллекция задач.",
    acceptanceCriteria: [
      "Sidebar слева с названиями списков",
      "Кнопка '+' для создания нового списка",
      "Переименование списка через double-click",
      "Удаление списка с confirm (удаляет все задачи внутри)",
      "Иконка и цвет для каждого списка",
      "Дефолтный список 'Inbox' создаётся при регистрации",
    ].join("\n"),
  },
  {
    externalId: "TODO-11",
    title: "Drag-and-drop сортировка",
    description:
      "Перетаскивание задач для изменения порядка внутри списка. Drag между списками для перемещения задачи. Визуальная индикация drop-зоны. Сохранение позиции на сервере.",
    acceptanceCriteria: [
      "Drag handle слева от задачи",
      "Плавная анимация при перетаскивании",
      "Ghost-элемент при перетаскивании",
      "Подсветка drop-зоны при наведении",
      "Drag между списками в sidebar",
      "Порядок сохраняется на сервере (optimistic UI)",
      "Touch-поддержка для мобильных",
    ].join("\n"),
  },
  {
    externalId: "TODO-12",
    title: "Теги / метки с цветами",
    description:
      "Система тегов для категоризации задач. Предустановленные цвета (8 вариантов). Автокомплит при вводе тега. Фильтрация списка по тегам.",
    acceptanceCriteria: [
      "Добавление тегов через input с автокомплитом",
      "8 предустановленных цветов для тегов",
      "Теги отображаются как цветные бейджи на карточке",
      "Максимум 5 тегов на задачу",
      "Фильтр по тегам в тулбаре (мультивыбор)",
      "Управление тегами: переименование, удаление, смена цвета",
    ].join("\n"),
  },
  {
    externalId: "TODO-13",
    title: "Вложенные подзадачи (чеклист)",
    description:
      "Внутри задачи можно добавить checklist из подзадач. Прогресс-бар показывает % выполнения. Подзадачи не являются полноценными todo — это лёгкий чеклист.",
    acceptanceCriteria: [
      "Кнопка 'Add checklist' в карточке задачи",
      "Инлайн-добавление подзадач (Enter для новой)",
      "Чекбокс для каждой подзадачи",
      "Прогресс-бар: '3/5 completed'",
      "Drag-and-drop для изменения порядка подзадач",
      "Удаление подзадачи через иконку ×",
      "Сворачивание/разворачивание чеклиста",
    ].join("\n"),
  },

  // Rich Content (3)
  {
    externalId: "TODO-14",
    title: "WYSIWYG редактор для описаний",
    description:
      "Rich text editor (Tiptap/ProseMirror) для поля описания задачи. Поддержка: bold, italic, списки, code-блоки, ссылки. Toolbar с кнопками форматирования.",
    acceptanceCriteria: [
      "Клик на описание — открывается WYSIWYG редактор",
      "Toolbar: Bold, Italic, Strikethrough, Code",
      "Нумерованные и маркированные списки",
      "Вставка ссылок с превью",
      "Code block с подсветкой синтаксиса",
      "Сохранение через Ctrl+S или blur",
      "Placeholder 'Add description...' когда пусто",
    ].join("\n"),
  },
  {
    externalId: "TODO-15",
    title: "Загрузка файлов (изображения, документы)",
    description:
      "Drag-and-drop загрузка файлов в описание задачи. Превью изображений. Поддержка: jpg, png, pdf, docx. Лимит 10MB на файл. Хранение в S3-compatible storage.",
    acceptanceCriteria: [
      "Drag-and-drop зона в описании задачи",
      "Кнопка 'Attach file' в toolbar",
      "Превью изображений (jpg, png, gif, webp)",
      "Иконка + имя для не-изображений (pdf, docx)",
      "Прогресс-бар загрузки",
      "Лимит: 10MB на файл, 50MB на задачу",
      "Удаление вложения через иконку ×",
    ].join("\n"),
  },
  {
    externalId: "TODO-16",
    title: "Markdown поддержка в заметках",
    description:
      "Поле заметок к задаче с Markdown-рендерингом. Live-preview: слева редактор, справа рендер. Поддержка GitHub Flavored Markdown (таблицы, чеклисты, code fences).",
    acceptanceCriteria: [
      "Вкладка 'Notes' в карточке задачи",
      "Split-view: editor | preview",
      "GFM: таблицы, task lists, code fences",
      "Подсветка синтаксиса в code blocks",
      "Toggle между edit/preview на мобильных",
      "Автосохранение при паузе ввода (debounce 1s)",
    ].join("\n"),
  },

  // Collaboration (3)
  {
    externalId: "TODO-17",
    title: "Шаринг списков (пригласить пользователей)",
    description:
      "Invite по email для совместного доступа к списку. Роли: viewer (только чтение), editor (полный доступ). Управление участниками в настройках списка.",
    acceptanceCriteria: [
      "Кнопка 'Share' в хедере списка",
      "Модалка: ввод email + выбор роли (viewer/editor)",
      "Приглашение приходит на email со ссылкой",
      "Принятие инвайта добавляет список в sidebar",
      "Список участников с ролями в настройках",
      "Удаление участника / смена роли",
      "Иконка шаринга на расшаренных списках",
    ].join("\n"),
  },
  {
    externalId: "TODO-18",
    title: "Комментарии к задачам",
    description:
      "Лента комментариев под каждой задачей. Поддержка @-mentions для уведомления участников. Редактирование и удаление своих комментариев.",
    acceptanceCriteria: [
      "Секция комментариев в карточке задачи",
      "Input с аватаром текущего пользователя",
      "@-mention с автокомплитом участников списка",
      "Уведомление упомянутому пользователю",
      "Редактирование своего комментария (иконка карандаша)",
      "Удаление своего комментария с confirm",
      "Timestamp 'x минут назад' с обновлением",
    ].join("\n"),
  },
  {
    externalId: "TODO-19",
    title: "Лог активности / история изменений",
    description:
      "Activity feed для каждого списка: кто, когда и что изменил. Фильтр по типу действия и пользователю. Timeline-формат с аватарами.",
    acceptanceCriteria: [
      "Вкладка 'Activity' в списке",
      "Типы событий: created, updated, completed, deleted, commented",
      "Формат: аватар + 'dev-1 completed Task X' + timestamp",
      "Фильтр по типу действия",
      "Фильтр по пользователю",
      "Пагинация — 'Load more' по 20 событий",
      "Real-time обновление для открытой вкладки",
    ].join("\n"),
  },

  // UX & Polish (4)
  {
    externalId: "TODO-20",
    title: "Тёмная тема",
    description:
      "Переключатель Light/Dark/System в настройках. CSS custom properties для всех цветов. Плавный transition при переключении. Сохранение выбора в localStorage.",
    acceptanceCriteria: [
      "Toggle в хедере: Light / Dark / System",
      "System — следует prefers-color-scheme",
      "Все элементы UI корректно отображаются в обеих темах",
      "Плавный transition (200ms) при переключении",
      "Выбор сохраняется в localStorage",
      "Нет flash of wrong theme при загрузке страницы",
    ].join("\n"),
  },
  {
    externalId: "TODO-21",
    title: "Мобильная адаптивность",
    description:
      "Responsive layout для экранов 320px–1440px. Sidebar скрывается в hamburger-меню на мобильных. Touch-оптимизированные размеры кнопок. Bottom sheet для карточки задачи.",
    acceptanceCriteria: [
      "Breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)",
      "Sidebar → hamburger menu на mobile",
      "Минимальный tap target — 44px",
      "Bottom sheet для карточки задачи на mobile",
      "Swipe left — delete, swipe right — complete",
      "Горизонтальная прокрутка тегов на mobile",
      "PWA: Add to Home Screen",
    ].join("\n"),
  },
  {
    externalId: "TODO-22",
    title: "Поиск и фильтры",
    description:
      "Глобальный поиск по всем спискам (Cmd+K). Фильтры: статус, приоритет, теги, дедлайн. Сохраняемые пресеты фильтров. Instant search без перезагрузки.",
    acceptanceCriteria: [
      "Cmd+K (Ctrl+K) открывает глобальный поиск",
      "Поиск по тексту задач, описаниям, тегам",
      "Instant results при вводе (debounce 200ms)",
      "Фильтры в тулбаре: Status, Priority, Tags, Due date",
      "Комбинация нескольких фильтров (AND-логика)",
      "Сохранение пресета фильтров по имени",
      "Сброс всех фильтров одной кнопкой",
    ].join("\n"),
  },
  {
    externalId: "TODO-23",
    title: "Горячие клавиши",
    description:
      "Набор keyboard shortcuts для быстрого управления. Справка по шорткатам (?). Кастомизация шорткатов в настройках.",
    acceptanceCriteria: [
      "N — новая задача",
      "E — редактировать выбранную",
      "D — удалить выбранную",
      "Space — toggle done",
      "↑/↓ — навигация по списку",
      "1-4 — смена приоритета",
      "? — модалка со списком шорткатов",
      "Шорткаты не срабатывают в input/textarea",
    ].join("\n"),
  },
];

async function main() {
  const passwordHash = await hashPassword("1234");

  console.log("Seeding users...");
  const createdUsers = await Promise.all(
    users.map((u) =>
      prisma.user.upsert({
        where: { name: u.name },
        update: { role: u.role, isScrumMaster: u.isScrumMaster },
        create: { name: u.name, passwordHash, role: u.role, isScrumMaster: u.isScrumMaster },
      })
    )
  );

  const ownerUser = createdUsers.find((u) => u.name === "dev-sm-1")!;
  console.log(`Created ${createdUsers.length} users. Owner: ${ownerUser.name} (${ownerUser.id})`);

  console.log("Seeding project...");
  let project = await prisma.project.findFirst({ where: { name: "Todo List App" } });
  if (!project) {
    project = await prisma.project.create({
      data: { name: "Todo List App", ownerId: ownerUser.id },
    });
    console.log(`Created project: ${project.name} (${project.id})`);
  } else {
    console.log(`Project already exists: ${project.name} (${project.id})`);
  }

  console.log("Seeding project members...");
  for (const user of createdUsers) {
    const memberSm = user.isScrumMaster;
    await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: user.id, projectId: project.id } },
      update: { isScrumMaster: memberSm },
      create: { userId: user.id, projectId: project.id, isScrumMaster: memberSm },
    });
  }
  console.log(`All ${createdUsers.length} members added to project.`);

  console.log("Seeding tickets...");
  let created = 0;
  let skipped = 0;
  for (const t of tickets) {
    const exists = await prisma.ticket.findFirst({
      where: { projectId: project.id, externalId: t.externalId },
    });
    if (exists) {
      skipped++;
      continue;
    }
    await prisma.ticket.create({
      data: {
        externalId: t.externalId,
        title: t.title,
        description: t.description,
        acceptanceCriteria: t.acceptanceCriteria,
        projectId: project.id,
      },
    });
    created++;
  }
  console.log(`Tickets: ${created} created, ${skipped} skipped (already exist).`);

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
