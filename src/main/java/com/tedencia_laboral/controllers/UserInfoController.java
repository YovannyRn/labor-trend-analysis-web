package com.tedencia_laboral.controllers;

import com.tedencia_laboral.models.UserInfo;
import com.tedencia_laboral.services.UserInfoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/user-info")
@CrossOrigin("*")
public class UserInfoController {

    private final UserInfoService userInfoService;

    public UserInfoController(UserInfoService userInfoService) {
        this.userInfoService = userInfoService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserInfo> getUserInfo(@PathVariable Long userId) {
        Optional<UserInfo> userInfo = userInfoService.getUserInfoByUserId(userId);
        return userInfo.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

}
