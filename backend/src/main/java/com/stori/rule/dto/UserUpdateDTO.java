package com.stori.rule.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserUpdateDTO {
    private Long id;
    private String username;
    private String nickname;
    private String password;
    private String email;
    private String phone;
    private Long roleId;
}
