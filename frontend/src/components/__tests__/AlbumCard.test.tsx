import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AlbumCard } from "../AlbumCard";
import type { Album } from "../../types/api";

// Mock the musicService
vi.mock("../../services/musicService", () => ({
  musicService: {
    getAlbumArtworkUrl: vi.fn((id: number) => `/artwork/${id}.jpg`),
  },
}));

const mockAlbum: Album = {
  id: 1,
  title: "Test Album",
  artist_id: 1,
  artist: {
    id: 1,
    name: "Test Artist",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  year: 2023,
  genre: "Rock",
  total_tracks: 10,
  total_discs: 1,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

describe("AlbumCard", () => {
  it("should render album information correctly", () => {
    render(<AlbumCard album={mockAlbum} />);

    // Test that album title is displayed
    expect(screen.getByText("Test Album")).toBeInTheDocument();

    // Test that artist name is displayed
    expect(screen.getByText("Test Artist")).toBeInTheDocument();

    // Test that year is displayed
    expect(screen.getByText("2023")).toBeInTheDocument();

    // Test that genre is displayed
    expect(screen.getByText("Rock")).toBeInTheDocument();

    // Test that track count is displayed
    expect(screen.getByText("10 tracks")).toBeInTheDocument();
  });

  it("should call onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<AlbumCard album={mockAlbum} onClick={handleClick} />);

    // Click the card
    fireEvent.click(screen.getByRole("img"));

    // Verify onClick was called with the album
    expect(handleClick).toHaveBeenCalledWith(mockAlbum);
  });

  it("should display artwork image with correct src", () => {
    render(<AlbumCard album={mockAlbum} />);

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", "/artwork/1.jpg");
    expect(image).toHaveAttribute("alt", "Test Album album cover");
  });

  it("should show disc count badge when album has multiple discs", () => {
    const multiDiscAlbum = { ...mockAlbum, total_discs: 2 };
    render(<AlbumCard album={multiDiscAlbum} />);

    expect(screen.getByText("2 Discs")).toBeInTheDocument();
  });

  it("should not show disc count badge for single disc albums", () => {
    render(<AlbumCard album={mockAlbum} />);

    expect(screen.queryByText("1 Discs")).not.toBeInTheDocument();
  });

  it("should handle missing artist gracefully", () => {
    const albumWithoutArtist = { ...mockAlbum, artist: undefined };
    render(<AlbumCard album={albumWithoutArtist} />);

    expect(screen.getByText("Unknown Artist")).toBeInTheDocument();
  });

  it("should handle missing year gracefully", () => {
    const albumWithoutYear = { ...mockAlbum, year: undefined };
    render(<AlbumCard album={albumWithoutYear} />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
});
