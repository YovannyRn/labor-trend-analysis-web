package com.tedencia_laboral.services;

import com.tedencia_laboral.models.UserInfo;
import com.tedencia_laboral.repositories.UserInfoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserInfoService {
    private final UserInfoRepository userInfoRepository;

    public UserInfoService(UserInfoRepository userInfoRepository) {
        this.userInfoRepository = userInfoRepository;
    }

    /**
     * Crea o actualiza la información de un usuario.
     *
     * @param userInfo La información del usuario a guardar.
     * @return El UserInfo guardado.
     */
    @Transactional
    public UserInfo saveUserInfo(UserInfo userInfo) {
        return userInfoRepository.save(userInfo);
    }

    /**
     * Obtiene la información de un usuario por su ID.
     *
     * @param userId El ID del usuario.
     * @return Un Optional que contiene el UserInfo si existe.
     */
    public Optional<UserInfo> getUserInfoByUserId(Long userId) {
        return userInfoRepository.findByUserId(userId);
    }

    /**
     * Actualiza la información de un usuario.
     *
     * @param userId      El ID del usuario.
     * @param firstName   El nuevo nombre.
     * @param lastName    El nuevo apellido.
     * @param address     La nueva dirección.
     * @return El UserInfo actualizado.
     */
    @Transactional
    public UserInfo updateUserInfo(Long userId, String firstName, String lastName, String address) {
        return userInfoRepository.findByUserId(userId).map(userInfo -> {
            userInfo.setFirstName(firstName);
            userInfo.setLastName(lastName);
            userInfo.setAddress(address);
            return userInfoRepository.save(userInfo);
        }).orElseThrow(() -> new RuntimeException("UserInfo no encontrado para el userId: " + userId));
    }

    /**
     * Elimina la información de un usuario por su ID.
     *
     * @param userId El ID del usuario.
     */
    @Transactional
    public void deleteUserInfoByUserId(Long userId) {
        userInfoRepository.findByUserId(userId).ifPresent(userInfoRepository::delete);
    }
}
