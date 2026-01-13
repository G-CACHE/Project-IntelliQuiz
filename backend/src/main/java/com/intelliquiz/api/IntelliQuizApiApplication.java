package com.intelliquiz.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class IntelliQuizApiApplication {

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(IntelliQuizApiApplication.class);
		app.addInitializers(new EnvInitializer());
		app.run(args);
	}

}
