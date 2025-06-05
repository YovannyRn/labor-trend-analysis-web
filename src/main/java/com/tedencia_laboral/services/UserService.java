package com.tedencia_laboral.services;

import com.tedencia_laboral.dtos.auth.CheckTokenRequest;
import com.tedencia_laboral.dtos.auth.LoginRequest;
import com.tedencia_laboral.dtos.auth.LoginResponse;
import com.tedencia_laboral.dtos.auth.RegisterRequest;
import com.tedencia_laboral.models.User;

import com.tedencia_laboral.models.UserInfo;
import com.tedencia_laboral.repositories.UserInfoRepository;
import com.tedencia_laboral.repositories.UserRepository;
import com.tedencia_laboral.security.JwtUtil;
import jakarta.transaction.Transactional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserInfoRepository userInfoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository,
                       UserInfoRepository userInfoRepository, AuthenticationManager authenticationManager,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.userInfoRepository = userInfoRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return this.userRepository.findByUsername(username)
                .map(user -> org.springframework.security.core.userdetails.User
                        .withUsername(user.getUsername())
                        .password(user.getPassword())
                        .build()
                ).orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }


    public List<User> getAllUsers() {
        return this.userRepository.findAll();
    }

    public Optional<User> getUserById(long id) {
        return this.userRepository.findById(id);
    }

    public Optional<User> findByUsername(String username) {
        return this.userRepository.findByUsername(username);
    }    @Transactional
    public void deleteUserById(long id) {
        // Verificar que el usuario existe antes de eliminar
        if (!this.userRepository.existsById(id)) {
            throw new IllegalArgumentException("Usuario no encontrado con ID: " + id);
        }
        
        // Eliminar UserInfo asociado primero (para evitar problemas de FK)
        this.userInfoRepository.findByUserId(id).ifPresent(this.userInfoRepository::delete);
        
        // Luego eliminar el User
        this.userRepository.deleteById(id);
    }

    @Transactional
    public User createUser(RegisterRequest userFromFront) {

        if (this.userRepository.existsByUsername(userFromFront.getUsername())) {
            throw new IllegalArgumentException("User already exists");
        }

        else {


            User user = new User();
            user.setUsername(userFromFront.getUsername());
            user.setPassword(
                    this.passwordEncoder.encode(userFromFront.getPassword())
            );
            user = this.userRepository.save(user);

            UserInfo userInfo = new UserInfo();
            userInfo.setUser(user);
            userInfo.setFirstName(userFromFront.getFirstName());
            userInfo.setLastName(userFromFront.getLastName());
            userInfo.setAddress(userFromFront.getAddress());

            this.userInfoRepository.save(userInfo);
            return user;
        }

    }


    public LoginResponse login(LoginRequest credentials) {
        // Comprobamos si el usuario existe
        User user = this.userRepository.findByUsername(credentials.getUsername()).orElseThrow(
                () -> new BadCredentialsException("User not found")
        );

        // Comprobamos si la contraseña no coincide con la que tenemos en la base de datos
        if (!this.passwordEncoder.matches(credentials.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid password");
        }        LoginResponse loginData = new LoginResponse();
        loginData.setUsername(credentials.getUsername());
        loginData.setToken(this.jwtUtil.generateToken(user));

        return loginData;
    }

    public boolean checkToken(CheckTokenRequest checkTokenRequest) {
        return this.jwtUtil.validateToken(
                checkTokenRequest.getToken(),
                checkTokenRequest.getUsername()
        );
    }


}




