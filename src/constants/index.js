const contactInfo = {
  email: "patrykkonior4@gmail.com",
  linkedin: "https://www.linkedin.com/in/patrykkonior/",
  github: "https://github.com/PatrykKonior",
};

// Legal identity shown in the footer and the privacy notice (public CEIDG data).
const company = {
  name: "Patryk Konior Programming Services",
  nip: "6272804661",
};

// CVs live in public/. The button only appears once the file for the current language exists.
const cvFiles = {
  en: "/Patryk-Konior-CV-EN.pdf",
  pl: "/Patryk-Konior-CV-PL.pdf",
};

// Labels for these live in the i18n dictionaries, in the same order.
const counterItems = [
  { value: 3, suffix: "+" },
  { value: 3, suffix: "" },
  { value: 3, suffix: "+" },
  { value: 45, suffix: "+" },
];

const logoIconsList = [
  { name: "Elixir", imgPath: "/images/tech/elixir.svg" },
  { name: "Phoenix", imgPath: "/images/tech/phoenix.svg" },
  { name: "React", imgPath: "/images/tech/react.svg" },
  { name: "TypeScript", imgPath: "/images/tech/typescript.svg" },
  { name: "Svelte", imgPath: "/images/tech/svelte.svg" },
  { name: "Node.js", imgPath: "/images/tech/nodejs.svg" },
  { name: "Python", imgPath: "/images/tech/python.svg" },
  { name: "C#", imgPath: "/images/tech/csharp.svg" },
  { name: ".NET", imgPath: "/images/tech/dotnet.svg" },
  { name: "PostgreSQL", imgPath: "/images/tech/postgresql.svg" },
  { name: "SQL Server", imgPath: "/images/tech/microsoftsqlserver.svg" },
  { name: "Docker", imgPath: "/images/tech/docker.svg" },
  { name: "Tailwind CSS", imgPath: "/images/tech/tailwindcss.svg" },
];

// Titles, descriptions and link labels live in the i18n dictionaries, in the same order.
const projects = [
  {
    tags: ["C#", ".NET Core", "Entity Framework", "WPF / MVVM", "React Native", "Expo", "TypeScript", "SQL Server"],
    architecture: {
      clients: [
        { name: "Web app", detail: "React", icon: "/images/tech/react.svg" },
        { name: "Mobile app", detail: "React Native", icon: "/images/tech/react.svg" },
        { name: "Desktop app", detail: "WPF / MVVM", icon: "/images/tech/csharp.svg" },
      ],
      server: { name: ".NET Core", detail: "REST API", icon: "/images/tech/dotnet.svg" },
      database: { name: "SQL Server", detail: "Entity Framework", icon: "/images/tech/microsoftsqlserver.svg" },
    },
    links: [
      { url: "https://github.com/PatrykKonior/MVVM_REST_API_CRUD" },
      { url: "https://github.com/PatrykKonior/ReacNative_MVVM_Company" },
      { url: "https://github.com/PatrykKonior/MVVM_Office" },
    ],
  },
  {
    tags: ["React", "React Router", "Bootstrap", "C#", ".NET Core", "SQL Server"],
    architecture: {
      clients: [
        { name: "Admin panel", detail: "React", icon: "/images/tech/react.svg" },
        { name: "Storefront", detail: "React", icon: "/images/tech/react.svg" },
      ],
      server: { name: ".NET Core", detail: "REST API", icon: "/images/tech/dotnet.svg" },
      database: { name: "SQL Server", detail: "Entity Framework", icon: "/images/tech/microsoftsqlserver.svg" },
    },
    links: [
      { url: "https://github.com/PatrykKonior/ReactAppPizza_Studia" },
      { url: "https://github.com/PatrykKonior/MVVM_PIZZA_REST_API_CRUD" },
    ],
  },
  {
    tags: ["Elixir", "Phoenix", "LiveView", "Ecto", "PostgreSQL"],
    architecture: {
      clients: [{ name: "LiveView", detail: "Real-time UI", icon: "/images/tech/phoenix.svg" }],
      server: { name: "Phoenix", detail: "Elixir / OTP", icon: "/images/tech/elixir.svg" },
      database: { name: "PostgreSQL", detail: "Ecto", icon: "/images/tech/postgresql.svg" },
    },
    links: [{ url: "https://github.com/PatrykKonior/PENTO_APPS" }],
  },
];

// Text for each service lives in the i18n dictionaries, in the same order.
const services = [
  { icons: ["/images/tech/react.svg", "/images/tech/svelte.svg", "/images/tech/phoenix.svg"] },
  { icons: ["/images/tech/elixir.svg", "/images/tech/nodejs.svg", "/images/tech/dotnet.svg"] },
  { icons: ["/images/tech/docker.svg", "/images/tech/linux.svg", "/images/tech/git.svg"] },
  { icons: ["/images/tech/html5.svg", "/images/tech/tailwindcss.svg", "/images/tech/typescript.svg"] },
];

// Titles, summaries and duties live in the i18n dictionaries, in the same order.
const expCards = [
  {
    company: "LTR Labs sp. z o.o.",
    period: "2026 — Now",
    stack: ["Elixir", "Phoenix", "LiveView", "Ecto", "Oban", "OTP / GenServer", "TypeScript", "JavaScript", "Svelte", "Tailwind CSS", "PostgreSQL", "Docker", "Nginx", "Linux", "S3", "CI/CD"],
  },
  {
    company: "Medas sp. z o.o.",
    period: "2025",
    stack: ["Node.js", "Express.js", "Microservices", "TypeScript", "REST API", "JWT / OAuth", "SQL Server", "T-SQL", "MongoDB", "Python", "PowerShell", "Windows Server", "Linux", "Nginx", "GitHub", "Jest", "React Testing Library"],
  },
  {
    company: "Medas sp. z o.o.",
    period: "2024 — 2025",
    stack: ["React", "JavaScript", "TypeScript", "Tailwind CSS", "CSS", "Webpack", "Figma", "GitHub"],
  },
];

export {
  company,
  cvFiles,
  logoIconsList,
  counterItems,
  expCards,
  projects,
  services,
  contactInfo,
};
