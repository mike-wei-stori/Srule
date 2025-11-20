package com.stori.rule.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableName;
import org.dromara.mpe.autotable.annotation.Table;
import org.dromara.mpe.autotable.annotation.Column;
import org.dromara.mpe.autotable.annotation.ColumnId;
import lombok.Data;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import java.time.LocalDateTime;

@Data
@TableName("sys_user")
@Table(value = "sys_user", comment = "系统用户表")
public class SysUser {
    @ColumnId(mode = IdType.AUTO)
    private Long id;
    
    @Column(value = "username", length = 50, notNull = true, comment = "用户名")
    private String username;
    
    @Column(value = "nickname", length = 100, comment = "用户昵称")
    private String nickname;
    
    @Column(value = "password", length = 100, notNull = true, comment = "密码(BCrypt加密)")
    private String password;
    
    @Column(value = "email", length = 100, comment = "邮箱地址")
    private String email;
    
    @Column(value = "phone", length = 20, comment = "手机号码")
    private String phone;
    
    @TableField(fill = FieldFill.INSERT)
    @Column(value = "created_at", comment = "创建时间")
    private LocalDateTime createdAt;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    @Column(value = "updated_at", comment = "更新时间")
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
