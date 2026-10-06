package com.vvu981.colivibackend.features.accommodation.repository.specification;

import java.util.List;
import java.util.Map;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import com.vvu981.colivibackend.features.accommodation.domain.AccommodationListing;
import com.vvu981.colivibackend.features.accommodation.domain.ListingStatus;

@Component
public class ListingSpecificationBuilder {

    private final List<ListingFilter> filters;

    // Spring inyecta automáticamente CUALQUIER clase que implemente la interfaz
    // ListingFilter
    public ListingSpecificationBuilder(List<ListingFilter> filters) {
        this.filters = filters;
    }

    public Specification<AccommodationListing> buildSpecification(Map<String, String> params) {
        // Condición base obligatoria: El anuncio debe estar aprobado por el
        // administrador
        Specification<AccommodationListing> spec = Specification.where(
                (root, query, cb) -> {
                    return cb.and(
                            cb.equal(root.get("status"), ListingStatus.AVAILABLE),
                            cb.isNull(root.get("deletedAt"))
                    );
                }
        );

        return applyFilters(spec, params);
    }

    public Specification<AccommodationListing> buildAdminSpecification(Map<String, String> params) {
        // Para admin, empezamos sin condiciones restrictivas (devuelve TODO, incluyendo borrados y baneados)
        Specification<AccommodationListing> spec = Specification.where(
                (root, query, cb) -> {
                    return null;
                }
        );
        return applyFilters(spec, params);
    }

    private Specification<AccommodationListing> applyFilters(Specification<AccommodationListing> baseSpec, Map<String, String> params) {
        Specification<AccommodationListing> spec = baseSpec;
        // Recorremos las estrategias de filtrado dinámicamente (Cero ifs rígidos)
        for (ListingFilter filter : filters) {
            if (filter.isApplicable(params)) {
                spec = spec.and(filter.apply(params));
            }
        }
        return spec;
    }
}
