package com.intelliquiz.api.domain.entities;

import net.jqwik.api.*;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for getter/setter completeness.
 * 
 * Feature: jpa-domain-entities, Property 5: Getter/Setter Completeness
 * Validates: Requirements 12.2
 */
public class GetterSetterPropertyTest {

    private static final List<Class<?>> ENTITY_CLASSES = Arrays.asList(
            User.class,
            Quiz.class,
            QuizAssignment.class,
            Question.class,
            Team.class,
            Submission.class
    );

    /**
     * Property 5: Getter/Setter Completeness
     * For any entity class, all non-static fields should have corresponding getter methods.
     */
    @Property(tries = 1)
    void allEntityFieldsHaveGetters(@ForAll("entityClasses") Class<?> entityClass) {
        Field[] fields = entityClass.getDeclaredFields();
        
        for (Field field : fields) {
            if (Modifier.isStatic(field.getModifiers())) {
                continue;
            }
            
            String fieldName = field.getName();
            String getterName = getGetterName(fieldName, field.getType());
            
            Method getter = findMethod(entityClass, getterName);
            assertThat(getter)
                    .as("Getter %s for field %s in %s", getterName, fieldName, entityClass.getSimpleName())
                    .isNotNull();
        }
    }

    /**
     * Property 5: Getter/Setter Completeness
     * For any entity class, all non-static, non-final fields should have corresponding setter methods.
     */
    @Property(tries = 1)
    void allEntityFieldsHaveSetters(@ForAll("entityClasses") Class<?> entityClass) {
        Field[] fields = entityClass.getDeclaredFields();
        
        for (Field field : fields) {
            if (Modifier.isStatic(field.getModifiers()) || Modifier.isFinal(field.getModifiers())) {
                continue;
            }
            
            String fieldName = field.getName();
            String setterName = getSetterName(fieldName, field.getType());
            
            Method setter = findMethodWithParam(entityClass, setterName, field.getType());
            assertThat(setter)
                    .as("Setter %s for field %s in %s", setterName, fieldName, entityClass.getSimpleName())
                    .isNotNull();
        }
    }

    @Provide
    Arbitrary<Class<?>> entityClasses() {
        return Arbitraries.of(ENTITY_CLASSES);
    }

    private String getGetterName(String fieldName, Class<?> fieldType) {
        // Handle boolean fields that already start with "is"
        if ((fieldType == boolean.class || fieldType == Boolean.class) && fieldName.startsWith("is")) {
            return fieldName; // e.g., isLiveSession -> isLiveSession()
        }
        String prefix = fieldType == boolean.class || fieldType == Boolean.class ? "is" : "get";
        return prefix + capitalize(fieldName);
    }

    private String getSetterName(String fieldName, Class<?> fieldType) {
        // Handle boolean fields that already start with "is" - setter removes the "is" prefix
        // e.g., isLiveSession -> setLiveSession
        if ((fieldType == boolean.class || fieldType == Boolean.class) && fieldName.startsWith("is") && fieldName.length() > 2) {
            String nameWithoutIs = fieldName.substring(2); // Remove "is" prefix
            return "set" + nameWithoutIs; // Already capitalized after "is"
        }
        return "set" + capitalize(fieldName);
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return Character.toUpperCase(str.charAt(0)) + str.substring(1);
    }

    private Method findMethod(Class<?> clazz, String methodName) {
        try {
            return clazz.getMethod(methodName);
        } catch (NoSuchMethodException e) {
            return null;
        }
    }

    private Method findMethodWithParam(Class<?> clazz, String methodName, Class<?> paramType) {
        try {
            return clazz.getMethod(methodName, paramType);
        } catch (NoSuchMethodException e) {
            // Try with primitive/wrapper conversion
            if (paramType == boolean.class) {
                try {
                    return clazz.getMethod(methodName, Boolean.class);
                } catch (NoSuchMethodException e2) {
                    return null;
                }
            } else if (paramType == int.class) {
                try {
                    return clazz.getMethod(methodName, Integer.class);
                } catch (NoSuchMethodException e2) {
                    return null;
                }
            }
            return null;
        }
    }

    /**
     * Additional test: Verify all entity classes have a no-arg constructor.
     */
    @Test
    void allEntitiesHaveNoArgConstructor() {
        for (Class<?> entityClass : ENTITY_CLASSES) {
            try {
                entityClass.getDeclaredConstructor();
            } catch (NoSuchMethodException e) {
                throw new AssertionError("Entity " + entityClass.getSimpleName() + " must have a no-arg constructor");
            }
        }
    }
}
