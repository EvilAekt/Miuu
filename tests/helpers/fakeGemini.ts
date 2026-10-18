// tests/helpers/fakeGemini.ts: Mock Handler untuk Google Gemini API tanpa koneksi internet
export class FakeGemini {
  private static mockResponseText: string | null = null;
  private static shouldThrow: boolean = false;
  private static statusCode: number = 200;

  public static setResponse(text: string, statusCode = 200): void {
    FakeGemini.mockResponseText = text;
    FakeGemini.statusCode = statusCode;
    FakeGemini.shouldThrow = false;
  }

  public static setJsonResponse(data: any, statusCode = 200): void {
    FakeGemini.setResponse(JSON.stringify(data), statusCode);
  }

  public static setError(shouldThrow = true): void {
    FakeGemini.shouldThrow = shouldThrow;
  }

  public static reset(): void {
    FakeGemini.mockResponseText = null;
    FakeGemini.shouldThrow = false;
    FakeGemini.statusCode = 200;
  }

  public static createMockFetch(): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      if (FakeGemini.shouldThrow) {
        throw new Error("FakeGemini network error simulation");
      }

      const bodyText = JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: FakeGemini.mockResponseText || "Default Gemini response" }],
            },
          },
        ],
      });

      return new Response(bodyText, {
        status: FakeGemini.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    };
  }
}
