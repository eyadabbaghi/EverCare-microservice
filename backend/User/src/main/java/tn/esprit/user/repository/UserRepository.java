package tn.esprit.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.user.entity.User;
import java.util.Optional;
import java.util.List;   // ✅ ADD THIS

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // ✅ ADD THIS
    List<User> findByRole(String role);
}
