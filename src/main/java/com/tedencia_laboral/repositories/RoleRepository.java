package com.tedencia_laboral.repositories;

import com.tedencia_laboral.enums.RoleName;
import com.tedencia_laboral.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByRoleName(RoleName roleName);
}