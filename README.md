# cv_recommender

A backend service that accepts a candidate's CV (PDF/DOCX/TXT/image), extracts structured
data using a multimodal LLM (OpenAI GPT-4o / Google Gemini), suggests concrete CV
improvements, and recommends relevant jobs with real apply/learning links.

- **Backend**: FastAPI + MongoDB + LangChain — see [backend/README.md](backend/README.md)
  for setup, running locally, and the test suite.
- **Frontend**: simple React UI (in progress).
- **CI/CD**: GitHub Actions workflows for dev/prod deploys live in
  [.github/workflows/](.github/workflows/).
