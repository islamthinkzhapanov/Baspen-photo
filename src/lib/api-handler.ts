import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (...args: any[]) => Promise<Response>;

export function withHandler<T extends RouteHandler>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }) as T;
}
