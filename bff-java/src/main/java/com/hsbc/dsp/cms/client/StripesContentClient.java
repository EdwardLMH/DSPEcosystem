package com.hsbc.dsp.cms.client;

import com.hsbc.dsp.cms.model.CmsContent;
import com.hsbc.dsp.cms.model.CmsScreenTemplate;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class StripesContentClient {

    private final WebClient webClient;

    public StripesContentClient(WebClient.Builder builder,
                                 StripesClientProperties props) {
        this.webClient = builder
            .baseUrl(props.baseUrl())
            .defaultHeader("Authorization", "Bearer " + props.apiKey())
            .build();
    }

    @Cacheable(value = "cmsContent", key = "#contentId + ':' + #locale")
    public Mono<CmsContent> getContent(String contentId, String locale) {
        return webClient.get()
            .uri("/api/content/{id}?locale={locale}", contentId, locale)
            .retrieve()
            .bodyToMono(CmsContent.class);
    }

    @Cacheable(value = "cmsTemplate", key = "#screenId + ':' + #platform")
    public Mono<CmsScreenTemplate> getScreenTemplate(String screenId, String platform) {
        return webClient.get()
            .uri("/api/templates/{screenId}?platform={platform}", screenId, platform)
            .retrieve()
            .bodyToMono(CmsScreenTemplate.class);
    }
}
