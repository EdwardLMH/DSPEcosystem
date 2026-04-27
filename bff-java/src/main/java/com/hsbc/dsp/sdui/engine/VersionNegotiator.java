package com.hsbc.dsp.sdui.engine;

import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class VersionNegotiator {

    // Maps client-declared max version to the schema version we'll actually serve
    private static final Map<String, String> VERSION_MATRIX = Map.of(
        "1.0", "1.0",
        "1.1", "1.0",
        "2.0", "2.0",
        "2.1", "2.0",
        "2.2", "2.0",
        "2.3", "2.3",
        "3.0", "2.3"   // serve latest stable until v3 is fully released
    );

    private static final String MINIMUM_SAFE_VERSION = "1.0";

    public String negotiate(String clientVersion) {
        if (clientVersion == null) return MINIMUM_SAFE_VERSION;
        return VERSION_MATRIX.getOrDefault(clientVersion, MINIMUM_SAFE_VERSION);
    }
}
