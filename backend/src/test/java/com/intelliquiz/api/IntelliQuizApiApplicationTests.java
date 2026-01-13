package com.intelliquiz.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;

@SpringBootTest
@ContextConfiguration(initializers = EnvInitializer.class)
class IntelliQuizApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
