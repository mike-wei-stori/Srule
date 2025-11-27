package com.stori.rule.dto;

import com.stori.rule.entity.SysUser;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * User Profile DTO with role information
 */
@Data
public class UserProfileDTO {
    private Long id;
    private String username;
    private String nickname;
    private String email;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Role information
    private List<RoleInfo> roles;

    // Permissions
    private List<String> permissions;
    
    @Data
    public static class RoleInfo {
        private Long id;
        private String name;
        private String code;
        private String description;
    }
    
    /**
     * Convert SysUser to UserProfileDTO
     */
    public static UserProfileDTO fromUser(SysUser user) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setNickname(user.getNickname());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
