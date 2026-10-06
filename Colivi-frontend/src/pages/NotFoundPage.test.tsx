import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { NotFoundPage } from "./NotFoundPage";

// Mock useAuth for Header within MainLayout
vi.mock("../features/auth/context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    logout: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("NotFoundPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
  };

  it("renderiza el contenido del 404 correctamente", () => {
    renderComponent();

    expect(screen.getByText(/error 404/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /página no encontrada/i })).toBeInTheDocument();
    expect(
      screen.getByText(/el espacio o enlace que buscas no existe/i)
    ).toBeInTheDocument();
  });

  it("contiene el botón para redirigir a la página de búsqueda/explorar", () => {
    renderComponent();

    const searchLink = screen.getByRole("link", { name: /ir a la búsqueda/i });
    expect(searchLink).toBeInTheDocument();
    expect(searchLink).toHaveAttribute("href", "/");
  });

  it("contiene el botón para explorar en el mapa", () => {
    renderComponent();

    const mapLink = screen.getByRole("link", { name: /explorar en el mapa/i });
    expect(mapLink).toBeInTheDocument();
    expect(mapLink).toHaveAttribute("href", "/map");
  });

  it("permite volver atrás haciendo click en el botón correspondiente", () => {
    renderComponent();

    const backButton = screen.getByRole("button", { name: /volver atrás/i });
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
