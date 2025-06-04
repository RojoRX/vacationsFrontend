import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AuthorizedVacationRequest } from 'src/interfaces/authorizedVacationRequest';
import { Gestion } from 'src/interfaces/gestion';
import { Receso } from 'src/interfaces/receso';

interface VacationRequest {
    ci: string;
    gestion: Gestion;
    requestId: number;
    userName: string;
    requestDate: string;
    position: string;
    department: string;
    academicUnit: string
    startDate: string;
    endDate: string;
    totalDays: number;
    status: string;
    returnDate: string;
    reviewDate: string;
    postponedDate: string | null;
    postponedReason: string | null;
    approvedByHR: boolean;
    approvedBySupervisor: boolean;
    managementPeriodStart: string;
    managementPeriodEnd: string;
    fechaIngreso: string;
    antiguedadEnAnios: number;
    diasDeVacacion: number;
    diasDeVacacionRestantes: number;
    recesos: Receso[];
    licenciasAutorizadas: {
        totalAuthorizedDays: number;
        requests: any[];
    };
    solicitudesDeVacacionAutorizadas: {
        totalAuthorizedVacationDays: number;
        requests: AuthorizedVacationRequest[];
    };
    debtData?: {
        diasDisponibles: number;
        deudaAcumulativaAnterior: number;
        deuda: number;
        startDate: string;
        endDate: string;
        deudaAcumulativaHastaEstaGestion: number;
    };
}

// Función mejorada para formatear fechas
const formatDate = (dateString: string) => {
    try {
        // Primero intentar parsear como ISO
        const date = parseISO(dateString);
        // Si la fecha es válida, formatear
        if (!isNaN(date.getTime())) {
            return format(date, 'dd/MM/yyyy', { locale: es });
        }
        // Si falla, intentar con formato de fecha simple
        const [year, month, day] = dateString.split('T')[0].split('-');
        const simpleDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return format(simpleDate, 'dd/MM/yyyy', { locale: es });
    } catch {
        return dateString.split('T')[0].split('-').reverse().join('/');
    }
};

export const generateVacationRequestPDF = (request: VacationRequest) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Estilos
    const titleStyle = { fontSize: 16, fontStyle: 'bold', textColor: [0, 0, 0] };
    const subtitleStyle = { fontSize: 14, fontStyle: 'bold', textColor: [0, 0, 0] };
    const normalStyle = { fontSize: 11, textColor: [0, 0, 0] };

    // Margenes (reducidos para aprovechar más espacio)
    const margin = 10; // Reducido de 15 a 10
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = margin;

    // Logo y Encabezado - CENTRADO
    doc.setFontSize(titleStyle.fontSize);
    doc.setFont('helvetica', titleStyle.fontStyle);
    doc.setTextColor(titleStyle.textColor[0], titleStyle.textColor[1], titleStyle.textColor[2]);

    // Calcular ancho del texto para centrar
    const title1 = 'Universidad Autónoma Tomás Frías';
    const title1Width = doc.getTextWidth(title1);
    doc.text(title1, (pageWidth - title1Width) / 2, yPosition);
    yPosition += 8;

    const title2 = 'Departamento de Personal';
    const title2Width = doc.getTextWidth(title2);
    doc.text(title2, (pageWidth - title2Width) / 2, yPosition);
    yPosition += 8;

    const title3 = 'Formulario de Solicitud y Concesión de Vacaciones';
    const title3Width = doc.getTextWidth(title3);
    doc.text(title3, (pageWidth - title3Width) / 2, yPosition);
    yPosition += 15;

    // Configuración común para las tablas (para aprovechar más ancho)
    const tableConfig = {
        margin: { left: margin, right: margin },
        styles: {
            fontSize: normalStyle.fontSize,
            cellPadding: 1.5,  // Más compacto
            overflow: 'linebreak',
            halign: 'left',
            valign: 'middle',
            lineColor: [0, 0, 0],  // Bordes negros
            lineWidth: 0.2
        },
        tableWidth: 'auto',
        bodyStyles: {
            valign: 'top'
        }
    };


    // 1. Datos del Solicitante
    doc.setFontSize(subtitleStyle.fontSize);
    doc.text('1. Datos del Solicitante', margin, yPosition);
    yPosition += 8;

    const applicantData = [
        ['Nombre de Usuario:', request.userName],
        ['Fecha de Ingreso:', formatDate(request.fechaIngreso)],
        ['Fecha de Solicitud:', formatDate(request.requestDate)],
        ['Unidad o Departamento:', request.department || request.academicUnit || 'No especificado'],
        ['Cargo que Ocupa:', request.position || 'No especificado'],
        ['Solicita Vacación a partir de:', formatDate(request.startDate)],
    ];


    autoTable(doc, {
        ...(tableConfig as Partial<UserOptions>),
        startY: yPosition,
        head: [],
        body: applicantData,
        tableWidth: 'auto',
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 70 },
            1: {
                cellWidth: 'auto',
                minCellWidth: pageWidth - margin * 2 - 70
            }
        }
    });


    yPosition = (doc as any).lastAutoTable.finalY + 6;

    // 2. Informe del departamento de Personal
    doc.setFontSize(subtitleStyle.fontSize);
    doc.text('2. Informe del departamento de Personal', margin, yPosition);
    yPosition += 8;

    const getRecessByName = (name: string) => {
        return request.recesos.find(receso => receso.name === name);
    };

    const personalReportData = [
        ['Vacación correspondiente a las gestión(es):', `${new Date(request.managementPeriodStart).getFullYear()} - ${new Date(request.managementPeriodEnd).getFullYear()}`],
        ['Años de Antigüedad:', request.antiguedadEnAnios.toString()],
        ['Días de Vacación por Antigüedad:', request.diasDeVacacion.toString()],
        ['Días de Licencia Autorizados cuenta Vacación:', request.licenciasAutorizadas.totalAuthorizedDays?.toString() || 'No disponibles'],
        ['Descanso pedagógico de Invierno:', `${getRecessByName('INVIERNO')?.daysCount || '0'} días`],
        ['Descanso de Fin de Año:', `${getRecessByName('FINDEGESTION')?.daysCount || '0'} días`],
        ['Días Acumulados de Deuda:', request.debtData?.deudaAcumulativaHastaEstaGestion?.toString() || '0'],
        ['Días de Vacación Disponibles Restantes:', request.debtData?.diasDisponibles?.toString() || '0']
    ];

    autoTable(doc, {
        ...(tableConfig as Partial<UserOptions>),
        startY: yPosition,
        head: [],
        body: personalReportData,  // ← CORREGIDO
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 70 },
            1: {
                cellWidth: 'auto',
                minCellWidth: pageWidth - margin * 2 - 70
            }
        }
    });


    yPosition = (doc as any).lastAutoTable.finalY + 6;

    // 3. Autorización del jefe inmediato Superior
    doc.setFontSize(subtitleStyle.fontSize);
    doc.text('3. Autorización del jefe inmediato Superior', margin, yPosition);
    yPosition += 8;

    const STATUS_OPTIONS = [
        { value: 'PENDING', label: 'Pendiente', color: 'default' },
        { value: 'AUTHORIZED', label: 'Autorizado', color: 'success' },
        { value: 'POSTPONED', label: 'Postergado', color: 'warning' },
        { value: 'DENIED', label: 'Rechazado', color: 'error' },
        { value: 'SUSPENDED', label: 'Suspendido', color: 'info' },
    ];
    const statusOption = STATUS_OPTIONS.find(s => s.value === request.status) || { label: request.status, color: 'default' };

    const supervisorData = [
        ['Estado:', statusOption.label],
        ['Fecha de Inicio:', formatDate(request.startDate)],
        ['Fecha de Revisión Jefe Superior:', request.reviewDate ? formatDate(request.reviewDate) : 'No disponible'],
        ['Postergado hasta:', request.postponedDate ? formatDate(request.postponedDate) : 'No disponible'],
        ['Justificación de la postergación:', request.postponedReason || 'No disponible']
    ];

    autoTable(doc, {
        ...(tableConfig as Partial<UserOptions>),
        startY: yPosition,
        head: [],
        body: supervisorData,
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 90 },
            1: { cellWidth: 'auto', minCellWidth: pageWidth - margin * 2 - 90 }
        }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 6;

    // 4. Decreto del Departamento de Personal
    doc.setFontSize(subtitleStyle.fontSize);
    doc.text('4. Decreto del Departamento de Personal', margin, yPosition);
    yPosition += 8;

    const decreeData = [
        ['Autorizado por Personal:', request.approvedByHR ? 'Sí' : 'No'],
        ['Fecha Fin de la vacación:', formatDate(request.endDate)],
        ['Total de días solicitados:', request.totalDays.toString()],
        ['Regreso:', formatDate(request.returnDate)]
    ];

    autoTable(doc, {
        ...(tableConfig as Partial<UserOptions>),

        startY: yPosition,
        head: [],
        body: decreeData,
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 90 },
            1: { cellWidth: 'auto', minCellWidth: pageWidth - margin * 2 - 90 }
        }
    });

    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth - margin - 30,
            doc.internal.pageSize.height - 10
        );
        doc.text(
            `Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
            margin,
            doc.internal.pageSize.height - 10
        );
    }

    return doc;
};