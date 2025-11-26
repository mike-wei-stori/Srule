package com.stori.rule.security;

import com.stori.rule.service.SysConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;

@Configuration
public class DbClientRegistrationRepository implements ClientRegistrationRepository {

    @Autowired
    private SysConfigService sysConfigService;

    @Override
    public ClientRegistration findByRegistrationId(String registrationId) {
        if ("google".equalsIgnoreCase(registrationId)) {
            return getGoogleClientRegistration();
        }
        return null;
    }

    private ClientRegistration getGoogleClientRegistration() {
        String clientId = sysConfigService.getValue("google.client.id");
        String clientSecret = sysConfigService.getValue("google.client.secret");

        if (clientId == null || clientSecret == null) {
            return null;
        }

        return ClientRegistration.withRegistrationId("google")
                .clientId(clientId)
                .clientSecret(clientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .scope("openid", "profile", "email")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://www.googleapis.com/oauth2/v4/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName(IdTokenClaimNames.SUB)
                .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .clientName("Google")
                .build();
    }
}
