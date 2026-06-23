package com.tesis.municipalidadbackendapp.eventos.controller;

import com.tesis.municipalidadbackendapp.eventos.dto.EventoPanelAdministrativoDto;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoRegistroRequest;
import com.tesis.municipalidadbackendapp.eventos.dto.ConteosRevisionDirectivaDto;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoRevisionDirectivaDetalleDto;
import com.tesis.municipalidadbackendapp.eventos.dto.EventoRevisionDirectivaResumenDto;
import com.tesis.municipalidadbackendapp.eventos.dto.ResumenCardsDirectivoDto;
import com.tesis.municipalidadbackendapp.eventos.service.EventoService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor //Crea el constructor para atributos final
@RequestMapping("api/eventos") //Ruta base del controller
public class EventoController {

    private final EventoService eventoService;

    @GetMapping("admin/operacion")
    public Page<EventoPanelAdministrativoDto> eventosPanelAdministrativo(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Integer categoriaId,
            @RequestParam(defaultValue = "false") boolean sinCategoria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        return eventoService.obtenerEventosPanelAdministrativo(
                texto,
                estado,
                categoriaId,
                sinCategoria,
                page,
                size
        );
    }

    @PostMapping("admin/operacion")
    public EventoPanelAdministrativoDto registrarEvento(
            @RequestBody EventoRegistroRequest request,
            HttpServletRequest httpServletRequest
    ) {
        return eventoService.registrarEvento(request, httpServletRequest);
    }

    @DeleteMapping("admin/operacion/{id}")
    public ResponseEntity<Void> eliminarEvento(
            @PathVariable Integer id,
            HttpServletRequest httpServletRequest
    ) {
        eventoService.eliminarEvento(id, httpServletRequest);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("admin/operacion/{id}")
    public EventoPanelAdministrativoDto actualizarEvento(
            @PathVariable Integer id,
            @RequestBody EventoRegistroRequest request,
            HttpServletRequest httpServletRequest
    ) {
        return eventoService.actualizarEvento(id, request, httpServletRequest);
    }

    @PatchMapping("admin/operacion/{id}/finalizar")
    public EventoPanelAdministrativoDto finalizarEvento(
            @PathVariable Integer id,
            HttpServletRequest httpServletRequest
    ) {
        return eventoService.finalizarEventoYGenerarValoraciones(id, httpServletRequest);
    }

    @GetMapping("admin/card/activos_desde_hoy")
    public Integer obtenerNumeroEventosActivosDesdeHoy() {
        return eventoService.obtenerNumeroEventosActivosDesdeHoy();
    }

    @GetMapping("admin/card/borradores")
    public Integer obtenerNumeroEventosBorradores(){
        return eventoService.obtenerNumeroEventosBorradores();
    }

    @GetMapping("admin/card/para_revision")
    public Integer obtenerNumeroEventosParaRevision(){
        return eventoService.obtenerNumeroEventosParaRevision();
    }

    @GetMapping("admin/card/observados")
    public Integer obtenerNumeroEventosObservados(){
        return eventoService.obtenerNumeroEventosObservados();
    }

    @GetMapping("directivo/cards")
    public ResumenCardsDirectivoDto obtenerResumenCardsDirectivo() {
        return eventoService.obtenerResumenCardsDirectivo();
    }

    @GetMapping("directivo/revision")
    public Page<EventoRevisionDirectivaResumenDto> obtenerEventosRevisionDirectiva(
            @RequestParam(defaultValue = "TODOS") String estado,
            @RequestParam(defaultValue = "0") int page
    ) {
        return eventoService.obtenerEventosRevisionDirectiva(estado, page);
    }

    @GetMapping("directivo/revision/conteos")
    public ConteosRevisionDirectivaDto obtenerConteosRevisionDirectiva() {
        return eventoService.obtenerConteosRevisionDirectiva();
    }

    @GetMapping("directivo/revision/{id}")
    public EventoRevisionDirectivaDetalleDto obtenerDetalleRevisionDirectiva(@PathVariable Integer id) {
        return eventoService.obtenerDetalleRevisionDirectiva(id);
    }

    @PatchMapping("directivo/operacion/{id}/cancelar")
    public EventoPanelAdministrativoDto cancelarEventoDirectivo(
            @PathVariable Integer id,
            @RequestBody(required = false) CancelarEventoRequest request,
            HttpServletRequest httpServletRequest
    ) {
        return eventoService.cancelarEventoDirectivo(
                id,
                request != null ? request.motivo() : null,
                httpServletRequest
        );
    }

    public record CancelarEventoRequest(String motivo) {}




}
