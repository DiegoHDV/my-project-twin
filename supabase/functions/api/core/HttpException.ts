/**
 * Excepción HTTP base. Permite lanzar errores con un código de estado
 * y que el ErrorMiddleware los traduzca a una respuesta uniforme.
 */
export class HttpException extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpException";
    this.status = status;
    this.details = details;
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedException";
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = "Forbidden") {
    super(403, message);
    this.name = "ForbiddenException";
  }
}

export class NotFoundException extends HttpException {
  constructor(message = "Not Found") {
    super(404, message);
    this.name = "NotFoundException";
  }
}

export class BadRequestException extends HttpException {
  constructor(message = "Bad Request", details?: unknown) {
    super(400, message, details);
    this.name = "BadRequestException";
  }
}
