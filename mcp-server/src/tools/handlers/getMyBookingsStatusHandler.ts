import { IMcpToolHandler, ToolExecutionResult } from "../types.js";
import { GET_MY_BOOKINGS_STATUS_TOOL } from "../../schemas/toolSchemas.js";
import { IBookingClient, bookingClient, BookingRequestItem, BookingRequestStatus } from "../../clients/bookingClient.js";
import { SecurityContextHolder } from "../../core/security/securityContext.js";

interface FormattedBooking {
  id: string;
  anuncioId: string;
  estado: BookingRequestStatus;
  fechaEntrada: string;
  fechaSalida: string;
  mensaje: string;
  fechaCreacion: string;
  fechaExpiracion: string;
  requiereAccionInmediata: boolean;
  accionRequerida: string;
}

export class GetMyBookingsStatusHandler implements IMcpToolHandler<Record<string, never>> {
  public readonly definition = GET_MY_BOOKINGS_STATUS_TOOL;
  public readonly requiredRole = "USER" as const;

  constructor(private readonly client: IBookingClient = bookingClient) {}

  public async execute(): Promise<ToolExecutionResult> {
    const context = SecurityContextHolder.getContext();
    const pageResponse = await this.client.getMyBookings({ page: 0, size: 50 });
    const bookings = pageResponse.content ?? [];

    if (bookings.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `El usuario inquilino autenticado (${context.email}) no tiene solicitudes de reserva registradas actualmente.`
          }
        ]
      };
    }

    const formattedBookings: FormattedBooking[] = bookings.map((item) =>
      this.formatBookingItem(item)
    );

    const pendientesCount = bookings.filter((b) => b.status === "PENDING").length;
    const aceptadasCount = bookings.filter((b) => b.status === "ACCEPTED").length;
    const confirmadasCount = bookings.filter((b) => b.status === "CONFIRMED").length;
    const rechazadasOExpiradasCount = bookings.filter(
      (b) => b.status === "REJECTED" || b.status === "EXPIRED" || b.status === "CANCELLED"
    ).length;

    const summary = {
      inquilino: {
        id: context.userId,
        email: context.email
      },
      metricas: {
        totalSolicitudes: bookings.length,
        pendientesDeRespuesta: pendientesCount,
        aceptadasRequierenPagoFianza: aceptadasCount,
        confirmadas: confirmadasCount,
        finalizadasORechazadas: rechazadasOExpiradasCount
      },
      solicitudes: formattedBookings
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(summary, null, 2)
        }
      ]
    };
  }

  private formatBookingItem(item: BookingRequestItem): FormattedBooking {
    const isAccepted = item.status === "ACCEPTED";
    const isPending = item.status === "PENDING";
    const isConfirmed = item.status === "CONFIRMED";
    const isRejected = item.status === "REJECTED";
    const isExpired = item.status === "EXPIRED";

    let accionRequerida: string;
    if (isAccepted) {
      accionRequerida = `URGENTE: Tu solicitud ha sido ACEPTADA por el anfitrion. Debes abonar la fianza y el primer mes antes de ${item.expiresAt ?? "la fecha limite"} para confirmar tu reserva.`;
    } else if (isPending) {
      accionRequerida = "En espera de aprobacion por parte del anfitrion.";
    } else if (isConfirmed) {
      accionRequerida = "Reserva confirmada. La fianza ha sido abonada y el contrato esta activo.";
    } else if (isRejected) {
      accionRequerida = "Solicitud rechazada por el anfitrion. Explora otros alojamientos disponibles en Colivi.";
    } else if (isExpired) {
      accionRequerida = "El plazo limite para abonar la fianza y confirmar expiro. La reserva ya no es valida.";
    } else {
      accionRequerida = "Solicitud cancelada.";
    }

    return {
      id: item.id,
      anuncioId: item.accommodationListingId,
      estado: item.status,
      fechaEntrada: item.startDate,
      fechaSalida: item.endDate,
      mensaje: item.message ?? "",
      fechaCreacion: item.createdAt,
      fechaExpiracion: item.expiresAt ?? "No aplica",
      requiereAccionInmediata: isAccepted,
      accionRequerida
    };
  }
}
